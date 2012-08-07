
var sp = getSpotifyApi(1);

var templates = {
  "layout": null,
  "player": null
};

var models;

var tempPlaylist = undefined;
var getNextTrack = function() {
  // Replace with code that looks up which artists are playing the nearest hours and get a random track by one of those artists and return it
  return tempPlaylist.tracks[Math.floor(Math.random()*tempPlaylist.length)];
}

var getFestivalInfo = function(track) {
  return {
    scene: "Azalea",
    due: "2 hours"
  }
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
    $.when.apply($, defs).done(function() {
      $("body").css("background", "url('img/background.jpg')");
      $("body").css("background-size", "100%");
      var layout = $(templates["layout"].main());
      $("body").append(layout);
      tempPlaylist = models.Playlist.fromURI("spotify:user:wayoutwestfestival:playlist:1VkQ6nbfU4gKjsPjqwE2kZ");
      exports.playlist = tempPlaylist;
      //models.player.play(playlist.tracks[0]);
      loadPlayer($(".player-container", layout));
    });
    
  });
}