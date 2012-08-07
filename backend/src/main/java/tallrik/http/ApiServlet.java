package tallrik.http;

import java.io.IOException;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONTokener;

import tallrik.Artist;
import tallrik.ArtistWithScore;
import tallrik.ArtistsGraph;
import tallrik.User;

public class ApiServlet extends HttpServlet {

  private final ArtistsGraph graph;

  public ApiServlet(ArtistsGraph graph) {
    this.graph = graph;
  }

  // TODO handle full char classes
  private static final Pattern USERNAME_PATTERN = Pattern.compile("^/([a-zA-Z0-9]+)$");

  @Override
  protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException,
      IOException {

    System.out.println("GET " + req.getRequestURI());

    Matcher uriMatcher = USERNAME_PATTERN.matcher(req.getRequestURI());
    if(uriMatcher.matches()) {
      String username = uriMatcher.group(1);

      System.out.println("Getting wow artists for " + username);

      List<ArtistWithScore> wowArtists = graph.getWowArtistForUser(new User(username));

      if(wowArtists != null) {
        try {
          JSONArray jsonArray = new JSONArray();

          for(ArtistWithScore wowArtist : wowArtists) {
            JSONObject artistJson = new JSONObject();
              artistJson.put("name", wowArtist.getArtist().getName());
            artistJson.put("score", wowArtist.getScore());

            jsonArray.put(artistJson);
          }

          JSONObject json = new JSONObject();
          json.put("artists", jsonArray);

          resp.getWriter().write(json.toString());
        } catch (JSONException e) {
          throw new ServletException(e);
        }
      } else {
        resp.sendError(404);
      }
    }

  }

  @Override
  protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException,
      IOException {

    System.out.println("POST " + req.getRequestURI());

    Matcher uriMatcher = USERNAME_PATTERN.matcher(req.getRequestURI());
    if(uriMatcher.matches()) {
      String username = uriMatcher.group(1);

      JSONTokener tokener = new JSONTokener(req.getReader());
      try {
        JSONObject root = new JSONObject(tokener);
        JSONArray artists = root.getJSONArray("artists");

        for(int i = 0; i<artists.length(); i++) {
          JSONObject artist = artists.getJSONObject(i);
          String artistName = artist.getString("name");

          graph.addUserLike(new User(username), new Artist(artistName));
        }
      } catch (JSONException e) {
        resp.sendError(400);
      }
    }
  }
}
