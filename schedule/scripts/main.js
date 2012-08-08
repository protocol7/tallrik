function gigsClash(gig1, gig2) {
  var startIsBetween = gig1.gig_start >= gig2.gig_start && gig1.gig_start <= gig2.gig_end
  var endIsBetween   = gig1.gig_end >= gig2.gig_start && gig1.gig_end <= gig2.gig_end
  return startIsBetween || endIsBetween
}

function gigTimeFree(gig, selectedGigs) {
  for(i in selectedGigs) {
    var selected = selectedGigs[i]
    if(gigsClash(gig, selected) || gigsClash(selected, gig)) {
      return false;
    }
  }

  return true;
}

function getParameterByName(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)')
                    .exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

$(function() {
  $.getJSON('scripts/artists.js', function(data) {
    gigs = data;

    var username = getParameterByName("username")

    $.getJSON('http://localhost:9999/' + username, function(data) {
      var selectedGigs = []

      $.each(data.artists, function(i, artist) {
        $.each(gigs, function(j, gig) {
          if(artist.name.toLowerCase() == gig.title.toLowerCase()) {
            if(gigTimeFree(gig, selectedGigs)) {
              selectedGigs.push(gig)
            }
          }
        })
      })

      // now we got all gigs to see, generate calendar data
      var calEvents = $.map(selectedGigs, function(gig) {
        return { title: gig.title, start: gig.gig_start, end: gig.gig_end, allDay: false}
      })

      var calOptions = {
        events: calEvents,
        defaultView: "agendaDay",
        timeFormat: 'HH:mm{-HH:mm}',
        header: {
          left: '',
          right: ''
        },
        year: 2012,
        month: 7,
        columnFormat: {
          day: 'dddd'
        },
        allDaySlot: false,
        axisFormat: 'HH:mm',
        height: 500,
        firstHour: 14
      }

      $('#calendar1').fullCalendar(
        $.extend({date: 9}, calOptions)
      )
      $('#calendar2').fullCalendar(
        $.extend({date: 10}, calOptions)
      )
      $('#calendar3').fullCalendar(
        $.extend({date: 11}, calOptions)
      )
    })
  })
})
