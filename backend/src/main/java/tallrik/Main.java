package tallrik;


import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import org.neo4j.graphdb.GraphDatabaseService;
import org.neo4j.graphdb.factory.GraphDatabaseFactory;

import tallrik.http.ApiServlet;

public class Main {

  private static GraphDatabaseService graphDb;

  public static void main(String[] args) throws Exception {
    graphDb = new GraphDatabaseFactory().newEmbeddedDatabase("/tmp/tallrik");
    registerShutdownHook();

    SimilarArtistFinder similarArtistFinder = new LastFmSimilarArtistFinder();

    WowArtists wowArtists = new WowArtists();

    ArtistsGraph graph = new ArtistsGraph(graphDb, similarArtistFinder, wowArtists.getArtists());

    if(graph.findArtistNodeByName(wowArtists.getArtists().get(0).getName()) == null) {
      // needs to be initialized
      System.out.println("Adding WoW artists");
      wowArtists.populate(graph);
    }

    graph.start();

    graph.addUserLike(new User("foo"), new Artist("jay z"));

    Server server = new Server(9999);
    ServletContextHandler root = new ServletContextHandler(server, "/");
    ApiServlet servlet = new ApiServlet(graph);
    root.addServlet(new ServletHolder(servlet), "/");

    server.start();
  }

  private static void shutdown() {
      graphDb.shutdown();
  }

  private static void registerShutdownHook() {
      Runtime.getRuntime().addShutdownHook( new Thread()
      {
          @Override
          public void run()
          {
              shutdown();
          }
      } );
  }

}
