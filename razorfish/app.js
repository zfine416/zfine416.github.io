$.ajax({
  url: 'gallery_json.js',
  dataType: 'json',
  success: function(data){
  	console.log(data);
  }
});