console.log("loaded");
var $me = $('.about .me');
var $glasses = $('.about .glasses');


// var pink = (width) + "px solid hotpink";


$( document ).ready(function() {
	var width = $(window).width();
	makeTriangle(width);
	var halfMe = $me.height()/2;
	centerImage(halfMe);
});

$(window).scroll(function() {
	console.log("scrolling");
	var meWidth = $me.width()*.371;
	leftGlasses(meWidth);
});

//function that sets triangle to window width
function makeTriangle(width){
	// var width = $(window).width();
	var black = (width) + "px solid black";
	$('.arrow-right').css('border-left', black);
	// $('.arrow-left').css('border-right', pink);
}

//resize triangle to width of window
$( window ).resize(function() {
	var width = $(window).width();
	makeTriangle(width);
	var halfMe = $me.height()/2;
	centerImage(halfMe);
	var meWidth = $me.width()*.371;
	leftGlasses(meWidth);
	console.log(meWidth); 
});

//center image

function centerImage(halfMe){
	var half = "calc(50% - " + halfMe + "px)";
	console.log(this);
	$me.css('top', half);
	console.log(half);
}

//glasses left att equals image width - pixels
//37.1% of $me.width

function leftGlasses(meWidth){
	var pix = meWidth + "px";
	console.log(pix);
	$glasses.css('left', pix);
}