console.log("loaded");
var $me = $('.about .me');
var $glasses = $('.about .glasses');



// var pink = (width) + "px solid hotpink";


$( document ).ready(function() {
	var width = $(window).width();
	makeTriangle(width);
	
});



//function that sets triangle to window width
function makeTriangle(width){
	var black = (width) + "px solid black";
	$('.arrow-right').css('border-left', black);
}

//resize triangle to width of window
$( window ).resize(function() {
	var width = $(window).width();
	makeTriangle(width);
});