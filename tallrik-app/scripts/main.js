
var sp = getSpotifyApi(1);

var templates = {
  "layout": null,
  "player": null,
  "tuner": null
};

var models;
var artists;
var venues;

var tempPlaylist = undefined;
var getNextTrack = function() {
  // Replace with code that looks up which artists are playing the nearest hours and get a 
  // random track by one of those artists and return it
  return tempPlaylist.tracks[Math.floor(Math.random()*tempPlaylist.length)];
}

var getFestivalInfo = function(track) {
  var artistName = track.data.artists[0].name.toLowerCase();
  var artist = artists[artistName];
  
  return {
    scene: venues[artist.venueID],
    startTime: artist.gig_start,
    endTime: artist.gig_end,
    due: getDueTime(artist.gig_start)
  }
}

var loadTuner = function(container) {
  var tuner = $(templates["tuner"].main());
  var dropPlaylistArea = $(".dropper", tuner);
  dropPlaylistArea.bind("dragover", function(e) {
    e.preventDefault();
    $(this).addClass("dragover");
    return false;
  });
  dropPlaylistArea.bind("dragleave", function(e) {
    e.stopPropagation();
    e.preventDefault();
    $(this).removeClass("dragover");
    return false;
  });
  dropPlaylistArea.bind("drop", function(e) {
    e.stopPropagation();
    e.preventDefault();
    $(this).removeClass("dragover");
    // Drop stuff
    return false;
  });
  container.html(tuner);
}

var getDueTime = function(startTime) {
  var currentTime = new Date();
  var msDifference = new Date(startTime) - currentTime;
  var minutesLeft = Math.floor(msDifference / (1000 * 60)); // ms to even minutes
  
  var returnString = '';
  if (minutesLeft >= 60) {
    var hoursLeft = Math.floor(minutesLeft / 60);
    var minutePart = minutesLeft - hoursLeft * 60;
    returnString = hoursLeft + ' hours ' + (minutePart > 0 ? minutePart + ' minutes' : '');
  } else if (minutesLeft > 0) {
    returnString = minutesLeft + ' minutes';
  }
  else {
    returnString = 'the future. Hopefully.';
  }
  return returnString;
}

var loadNowPlaying = function(container, track) {
  exports.t = container;
  var festivalInfo = getFestivalInfo(track);
  var nowPlaying = $(templates["player"].nowPlaying({ image: track.image, artist: track.artists[0].name, title: track.name, scene: festivalInfo.scene, due: festivalInfo.due }));
  container.html(nowPlaying);
}

var loadPlayer = function(container) {
  var player = $(templates["player"].player());
  var track = getNextTrack();
  loadNowPlaying($(".now-playing-container", player), track);
  $(".play-button", player).click(function() {
    models.player.play(track);
    return false;
  });
  loadTuner($(".tuner-container", player));
  container.html(player);
}

exports.init = function () {
  
  sp.require("scripts/jquery-1.7.2.min");
  sp.require("scripts/jquery-ui-1.8.21.custom.min");
  sp.require("scripts/less-1.3.0.min");
  var slab = sp.require("scripts/slab").slab;
  models = sp.require('sp://import/scripts/api/models');
  exports.models = models;
  
  $(function() {
  
    var t = templates;
    templates = {};
	
    var defs = $.map(t, function(_, k) { return $.get("templates/" + k + ".slab", function(data) { templates[k] = slab.compile(data); }) });
	defs.push($.get('http://apps.wayoutwest.se/wow-phone-app/2012/desktop/artists.php', function(data) {
      artists = {};
      $.map(data, function(a, _) {
        artists[a.title.toLowerCase()] = {
          gig_start: a.gig_start,
          gig_end: a.gig_end,
          venueID: a.venueID
        };
      });
    }).error(function() { alert("Error loading artist data."); }));
    defs.push($.get('http://apps.wayoutwest.se/wow-phone-app/2012/desktop/venues.php', function(data) {
      venues = new Array;
      $.map(data.result, function(v, _) {
        venues[v.ID] = v.title; 
      });
    }).error(function() { alert("Error loading venue data."); }));
	
    $.when.apply($, defs).done(function() {
      var layout = $(templates["layout"].main());
      $("body").append(layout);
      tempPlaylist = models.Playlist.fromURI("spotify:user:wayoutwestfestival:playlist:1VkQ6nbfU4gKjsPjqwE2kZ");
      exports.playlist = tempPlaylist;
      //models.player.play(playlist.tracks[0]);
      loadPlayer($(".player-container", layout));
    });
    
  });
}