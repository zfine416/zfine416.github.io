jQuery(function() {
	$.ajax({
	  url: 'gallery_json.js',
	  dataType: 'json',
	  success: function(data){
	  	console.log(data);
	  },
	  error: function(xhr, status, error) {
	  	console.log(error);
	  }
	});
})