package tallrik;

import java.util.Comparator;

public final class ArtistWithScoreComparator implements Comparator<ArtistWithScore> {
  public int compare(ArtistWithScore o1, ArtistWithScore o2) {
    return Float.compare(o2.getScore(), o1.getScore());
  }
}