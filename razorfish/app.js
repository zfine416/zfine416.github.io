$.ajax({
	url: 'gallery_json.js',
	dataType: 'json',
	success: function(data){
		console.log(data);
		parseData(data);
	}
});

function parseData(data){
	var header = data["album"]["name"];
	$('.main').append("<p>"+header+"</p>");
	var photos = data["photos"];
	var plength = photos.length;
	for(var i=0; i<plength; i++){
		$('#car').append("<div><img src="+photos[i]["url"]+"></div>");
	}
	$('#car').slick();
}


