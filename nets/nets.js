function createCORSRequest(method, url){
    var xhr = new XMLHttpRequest();
    if ("withCredentials" in xhr){
        xhr.open(method, url, true);
    } else if (typeof XDomainRequest != "undefined"){
        xhr = new XDomainRequest();
        xhr.open(method, url);
    } else {
        xhr = null;
    }
    return xhr;
}

var request = createCORSRequest("get", "http://www.nba.com/nets/api/v1/json?tags=brooklenns-own");
if (request){
    request.onload = function() {
        console.log('hello');
    };
    request.onreadystatechange = handler;
    request.send();
}