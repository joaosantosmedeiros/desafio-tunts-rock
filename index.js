const express = require('express');
const { google } = require('googleapis');

const app = express();

app.get('/', async (req, res) => {
  // set required data
  const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json',
    scopes: 'https://www.googleapis.com/auth/spreadsheets',
  });
  const client = auth.getClient();
  const googleSheets = google.sheets({
    version: 'v4',
    auth: client,
  });
  const spreadsheetId = '1TCcqAcCK4Gk2TAZH01D9n9UP2owAcBXgVB6P89kxL9U';

  // read rows from spreadsheet
  console.log('reading rows from spreadsheed...')
  const getRows = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: 'engenharia_de_software!C4:F27',
  });
  const rowsValues = getRows.data.values;
  
  // calculate situations and necessary grades
  const situations = [];
  const necessaryGrades = [];
  for (const row of rowsValues) {
    const media = Math.ceil((parseInt(row[1]) + parseInt(row[2]) + parseInt(row[3])) / 3);
    let neededGrade = 0;
    if (parseInt(row[0]) >= 15) {
      situations.push(['Reprovado por falta']);
    } else if (media < 50) {
      situations.push(['Reprovado por nota']);
    } else if (media >= 50 && media < 70) {
      situations.push(['Exame final']);
      neededGrade = Math.ceil(100 - media);
    } else {
      situations.push(['Aprovado']);
    }
    necessaryGrades.push([neededGrade]);
  }

  // write rows
  console.log('appending situations data...')
  await googleSheets.spreadsheets.values.update({
    auth,
    spreadsheetId,
    range: 'engenharia_de_software!G4:G28',
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: situations,
    },
  });

  console.log('appending necessary grades data...')
  await googleSheets.spreadsheets.values.update({
    auth,
    spreadsheetId,
    range: 'engenharia_de_software!H4:H28',
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: necessaryGrades,
    },
  });

  return res.status(200).json({
    status: true,
    message: 'Sucess! Visualize the updated data at: https://docs.google.com/spreadsheets/d/1TCcqAcCK4Gk2TAZH01D9n9UP2owAcBXgVB6P89kxL9U/edit#gid=0'
  });
});

app.listen(5000, () => {
  console.log('server running at http://localhost:5000');
});
