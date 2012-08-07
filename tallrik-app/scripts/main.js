﻿
var sp = getSpotifyApi(1);

var templates = {
  "layout": null,
  "player": null,
  "tuner": null
};

var models;
var artists;
var venues;

var getNextTrack = function(callback) {
  // Replace with code that looks up which artists are playing the nearest hours and get a 
  // random track by one of those artists and return it
  getTopTrackForArtist("Rambling Nicholas Heron", function(tracks) {
    callback(tracks[Math.floor(Math.random()*tracks.length)]);
  });
}

var getTopTrackForArtist = function(artistName, callback) {
  var search = new models.Search(artistName);
  search.localResults = models.LOCALSEARCHRESULTS.APPEND;
  search.observe(models.EVENT.CHANGE, function() {
    callback(search.tracks);
  });
  search.appendNext();
}

var getFestivalInfo = function(track) {
  var artistName = track.data.artists[0].name.toLowerCase();
  var artist = artists[artistName];
  if(artist == undefined) return undefined;
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
  if(festivalInfo == undefined) container.html("Cannot find '" + track.artists[0].name + "' in festival schema");
  else {
    models.Artist.fromURI(track.artists[0].uri, function(artist) {
      
      var nowPlaying = $(templates["player"].nowPlaying({ 
        image: artist.image, 
        image2: track.image,
        artist: track.artists[0].name,
        artistUri: artist.uri,
        title: track.name,
        scene: festivalInfo.scene, 
        due: festivalInfo.due 
      }));
      container.empty();
      container.append(nowPlaying);
    });
  }
}

var loadPlayer = function(container) {
  var player = $(templates["player"].player());
  var playerPlaylist = new models.Playlist();
  getNextTrack(function(track2) { 
    playerPlaylist.add(track2);
    getNextTrack(function(track3) { 
      playerPlaylist.add(track3); 
      
      var track = playerPlaylist.tracks[0];
      console.dir(track);
      loadNowPlaying($(".now-playing-container", player), track);
      $(".play-button", player).click(function() {
        models.player.play(track, playerPlaylist);
        return false;
      });
      $(".skip-button", player).click(function() {
        models.player.next();
        return false;
      });
      loadTuner($(".tuner-container", player));
      models.player.observe(models.EVENT.CHANGE, function(event) {
        loadNowPlaying($(".now-playing-container", player), models.player.track);
        getNextTrack(function(track) { 
          playerPlaylist.add(track);
        });
      });
      container.empty();
      container.append(player);
      
      });
  });
  
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
      //models.player.play(playlist.tracks[0]);
      loadPlayer($(".player-container", layout));
    });
    
  });
}