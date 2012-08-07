package tallrik;

public class Artist {

  public static String normalizeName(String name) {
    return name.toLowerCase();
  }

  private final String name;

  public Artist(String name) {
    this.name = normalizeName(name);
  }

  public String getName() {
    return name;
  }

  @Override
  public String toString() {
    return "Artist [" + name + "]";
  }
}