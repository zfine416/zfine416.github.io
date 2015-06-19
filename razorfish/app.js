$.ajax({
	url: 'gallery_json.js',
	dataType: 'json',
	success: function(data){
		console.log(data);
		var header = data["album"]["name"];
		console.log(header);
		parseData(data);
	}
});

function parseData(data){
	var header = data["album"]["name"];
	debugger;

}
