package tallrik;

public class ArtistWithScore {
  private final Artist artist;
  private final float score;

  public ArtistWithScore(Artist artist, float score) {
    this.artist = artist;
    this.score = score;
  }

  public ArtistWithScore(String artistName, float score) {
    this(new Artist(artistName), score);
  }

  public ArtistWithScore(ArtistWithScore a1, ArtistWithScore a2) {
    this(a1.getArtist(), a1.getScore() + a2.getScore());
  }

  public Artist getArtist() {
    return artist;
  }

  public float getScore() {
    return score;
  }

  @Override
  public String toString() {
    return "[" + artist + ", " + score + "]";
  }


}