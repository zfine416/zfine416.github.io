console.log('loaded');

// document on ready function
$(function() {
	// JSON request to get MLB json data which is hosted on my personal website
	$.getJSON('http://zacharyfine.space/json/mlb.json', function(data) {
	events = data.sports[0].leagues[0].events;
		$.each(events, function(index, event) {
			renderEvent(event);
		})
	});

	//function sets text of dropdown menu when new date is selected
	$('.dropdown-menu a').on('click', function() {
		$('.dropdown-toggle').text($(this).text()).append("<span class='caret'>");
	})
});

//function test if game is final, else converts into useful date with moment.js
var isFinal = function(status) {
	var makeDate = new Date(status);
	return isNaN( makeDate.getTime() ) ? false : true;
};

//function that builds new object with extracted data
var renderEvent = function(event) {
	var status = event.competitions[0].status.shortDetail;
	event.status = isFinal(status) ? moment(new Date(status)).format('h:mm A') : status;
	event.firstButton = isFinal(status) ? "Pick Center" : "Box Score";
	event.firstButtonLink = isFinal(status) ? event.links.web.pickcenter.href : event.links.web.boxscore.href;
	var fenwayScoreboard = '<div class="fenway-board"><div class="table-container"><table class="score-table"><thead><th class="gametime">{{ status }}</th><th class="score">R</th></thead><tr class="away"><td><div class="team-container"><h2>{{ competitions.0.competitors.1.team.name }}</h2><div class="record-container">{{ competitions.0.competitors.1.team.record.summary }}</div></div></td><td class="score"><span>{{ competitions.0.competitors.1.score }}</span></td></tr><tr class="home"><td><div class="team-container"><h2>{{competitions.0.competitors.0.team.name}}</h2><div class="record-container">{{competitions.0.competitors.0.team.record.summary}}</div></div></td><td class="score"><span>{{ competitions.0.competitors.0.score }}</span></td></tr></table></div><div class="game-info"><div><span>Pitchers</span></div><div class="pitcher"><a href="{{ competitions.0.stats.awayStartingPitcher.athlete.links.web.href }}">{{ competitions.0.stats.awayStartingPitcher.athlete.firstName.0 }} {{ competitions.0.stats.awayStartingPitcher.athlete.lastName }}</a></div><div class="pitcher"><a href="{{ competitions.0.stats.homeStartingPitcher.athlete.links.web.href }}">{{ competitions.0.stats.homeStartingPitcher.athlete.firstName.0 }} {{ competitions.0.stats.homeStartingPitcher.athlete.lastName }}</a></div></div><div class="recap"><div>&nbsp;</div><div class="button"><a href={{ firstButtonLink }}>{{ firstButton }}</a></div><div class="button"><a href={{ links.web.conversation.href }}>Conversation</a></div></div></div>';
	$('.main-scoreboard').append(Mustache.to_html(fenwayScoreboard, event)).fadeIn();
	var gameTemplate = '<li><div class="mlb-game"><a class="game-link"><div class="score-overview"><div class="date-time">{{ status }}</div><div></div></div><div class="score-details"><ul class="competitors"><li class="away-team"><div class="team-name">{{ competitions.0.competitors.1.team.abbreviation }}</div><div class="team-score"> {{ competitions.0.competitors.1.score }}</div></li><li class="home-team"><div class="team-name">{{ competitions.0.competitors.0.team.abbreviation }}</div><div class="team-score">{{ competitions.0.competitors.0.score }}</div></li></ul></div></a></div></li>';
	$('.active-date').append(Mustache.to_html(gameTemplate, event));
};


