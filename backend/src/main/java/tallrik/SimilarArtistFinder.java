package tallrik;

import java.util.List;

public interface SimilarArtistFinder {
  List<Artist> findSimilar(Artist artist);
}