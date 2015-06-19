$.ajax({
  url: 'gallery_json.js',
  dataType: 'json',
  success: dataLog(data)
  }
});

function dataLog(data){
	console.log(data);
}