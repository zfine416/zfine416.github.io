$(document).ready(function() {
	
  // initialize masonry
  // $('.grid').masonry({
  //   // options
  //   itemSelector: 'img',
  //   columnWidth: 20
  // });
  $('.fa-chevron-down').on('click', function() {
    $(document).scrollTo($('#about'), {duration: 1200});
  })
});

// Add pulse tag to projectsHeader when user scrolls to section
$(window).scroll(function() {
  const aboutHT    = $('#about').offset().top,
      projectsHT = $('#projects').offset().top,
      wS = $(this).scrollTop();
  if(wS === aboutHT){
      $('#aboutHeader').addClass('animated');
      $('#aboutHeader').addClass('pulse');
    }
  if(wS === projectsHT) {
    $('#projectsHeader').addClass('animated');
    $('#projectsHeader').addClass('pulse');
  }
})




