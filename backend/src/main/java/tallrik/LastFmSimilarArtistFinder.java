package tallrik;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.List;

public class LastFmSimilarArtistFinder implements SimilarArtistFinder {

  public List<Artist> findSimilar(Artist artist) {
    try {
      String encodedName = URLEncoder.encode(artist.getName().toLowerCase(), "UTF-8");

      // might return a 400 if search doesn't match
      BufferedReader reader = new BufferedReader(
        new InputStreamReader(new URI("http://ws.audioscrobbler.com/2.0/artist/" + encodedName + "/similar.txt").toURL().openStream()));

      List<Artist> similarArtists = new ArrayList<Artist>();
      String line = reader.readLine();
      while(line != null) {
        String similarName = line.split(",")[2];

        similarArtists.add(new Artist(similarName));

        line = reader.readLine();
      }
      return similarArtists;
    } catch (Exception e) {
      return null;
    }
  }
}