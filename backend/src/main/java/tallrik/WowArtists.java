package tallrik;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

public class WowArtists {

  private final List<Artist> artists;

  public WowArtists() throws IOException {
    BufferedReader artistReader = null;
    try {
      artistReader = new BufferedReader(new InputStreamReader(WowArtists.class.getClassLoader().getResourceAsStream("artists.txt")));

      List<Artist> artists = new ArrayList<Artist>();

      String artistName = artistReader.readLine();
      while(artistName != null) {
        if(artistName != null) {
          artistName = artistName.trim();
          if(artistName.length() > 0) {
            artists.add(new Artist(artistName));

            artistName = artistReader.readLine();
          }
        }
      }

      this.artists = artists;
    } finally {
      if(artistReader != null) {
        artistReader.close();
      }
    }
  }

  public List<Artist> getArtists() {
    return artists;
  }

  public void populate(ArtistsGraph graph) throws IOException {
    for(Artist artist : artists) {
      graph.getOrAddArtist(artist);
    }
  }
}