package tallrik;

public class User {

  private final String username;

  public User(String username) {
    this.username = username;
  }

  public String getUsername() {
    return username;
  }

  @Override
  public String toString() {
    return "Artist [" + username + "]";
  }
}