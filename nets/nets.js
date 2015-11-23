$.ajax({
	url: 'http://www.nba.com/nets/api/v1/json?tags=brooklenns-own'
}).done(function(data){
	console.log(data);
});