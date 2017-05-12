$(document).ready(function() {
	
  // initialize masonry
  $('.grid').masonry({
    // options
    itemSelector: '.grid-item',
    columnWidth: 160
  });
  $('.fa-chevron-down').on('click', function() {
    $(document).scrollTo($('#projects'), {duration: 1200});
  })
});

// Add pulse tag to projectsHeader when user scrolls to section
$(window).scroll(function() {
  var hT = $('#projects').offset().top,
      wS = $(this).scrollTop();
  if(wS === hT){
      $('#projectsHeader').addClass('animated');
      $('#projectsHeader').addClass('pulse');
    }
})

// initialize masonry
$('.grid').masonry({
  // options
  itemSelector: '.grid-item',
  columnWidth: 300
});



