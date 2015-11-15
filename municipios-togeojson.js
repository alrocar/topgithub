var XLS = require('xlsjs');
var fs = require('fs');
var munis = XLS.readFile('municipios-espana-coordenadas-2011.xls');

function to_csv(workbook) {
  var result = [];
  workbook.SheetNames.forEach(function(sheetName) {
  	console.log(sheetName);
    var json = XLS.utils.sheet_to_json(workbook.Sheets[sheetName]);
    if(json.length > 0){
      fs.writeFileSync('municipios.json', JSON.stringify(json, null, 4));
    }
  });
}

to_csv(munis);