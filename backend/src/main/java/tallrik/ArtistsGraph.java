package tallrik;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

import org.neo4j.graphalgo.GraphAlgoFactory;
import org.neo4j.graphalgo.PathFinder;
import org.neo4j.graphdb.Direction;
import org.neo4j.graphdb.GraphDatabaseService;
import org.neo4j.graphdb.Node;
import org.neo4j.graphdb.Path;
import org.neo4j.graphdb.Relationship;
import org.neo4j.graphdb.Transaction;
import org.neo4j.graphdb.index.Index;
import org.neo4j.graphdb.index.IndexHits;
import org.neo4j.kernel.Traversal;
import org.neo4j.tooling.GlobalGraphOperations;

public class ArtistsGraph {

  private static final ArtistWithScoreComparator ARTIST_WITH_SCORE_COMPARATOR = new ArtistWithScoreComparator();

  private final GraphDatabaseService graphDb;
  private final Index<Node> artistsByNameIndex;
  private final Index<Node> usersByNameIndex;
  private final SimilarArtistFinder similarArtistFinder;

  private final List<Artist> wowArtists;
  private final List<Node> wowArtistNodes = new ArrayList<Node>();

  public ArtistsGraph(GraphDatabaseService graphDb, SimilarArtistFinder similarArtistFinder,
                      List<Artist> wowArtists) {
    this.graphDb = graphDb;
    this.artistsByNameIndex = graphDb.index().forNodes("artists-by-name");
    this.usersByNameIndex = graphDb.index().forNodes("users-by-name");
    this.similarArtistFinder = similarArtistFinder;

    this.wowArtists = wowArtists;
  }

  public void start() {
    for(Artist wowArtist : wowArtists) {
      Node wowArtistNode = findArtistNodeByName(wowArtist.getName());

      wowArtistNodes.add(wowArtistNode);
    }
  }

  public Node findArtistNodeByName(String name) {
    return findNodeByName(name, artistsByNameIndex);
  }

  public Node findUserNodeByName(String name) {
    return findNodeByName(name, usersByNameIndex);
  }

  private Node findNodeByName(String name, Index<Node> index) {
    IndexHits<Node> indexHits = index.get("name", Artist.normalizeName(name));
    if(indexHits.size() > 0) {
      return indexHits.next();
    } else {
      return null;
    }
  }

  private String getName(Node node) {
    return (String) node.getProperty("name");
  }

  private Node createArtistNode(Artist artist) {
    Node node = graphDb.createNode();
    node.setProperty("name", artist.getName());
    node.setProperty("type", "artist");
    return node;
  }

  private Node createUserNode(User user) {
    Node node = graphDb.createNode();
    node.setProperty("name", user.getUsername());
    node.setProperty("type", "user");
    return node;
  }

  public void addUserLike(User user, Artist artist) {
    Transaction tx = graphDb.beginTx();

    try {
      Node userNode = getOrAddUser(user);
      Node artistNode = getOrAddArtist(artist);

      if(!NodeUtils.areConnected(userNode, artistNode, TallrikRelTypes.LIKES, Direction.BOTH)) {
        System.out.println("Adding like " + getName(userNode) + " -> " + getName(artistNode));

        // TODO scoring
        userNode.createRelationshipTo(artistNode, TallrikRelTypes.LIKES);
      }

      tx.success();
    } finally {
      tx.finish();
    }
  }

  public List<ArtistWithScore> getUserLikedArtists(User user) {
    Node userNode = findUserNodeByName(user.getUsername());

    List<ArtistWithScore> artists = new ArrayList<ArtistWithScore>();
    if(userNode != null) {
      for(Relationship rel : userNode.getRelationships(TallrikRelTypes.LIKES)) {
        Node artistNode = rel.getOtherNode(userNode);
        artists.add(new ArtistWithScore(getName(artistNode), 1));
      }

      return artists;
    } else {
      return null;
    }
  }

  public List<ArtistWithScore> getWowArtistForUser(User user) {

    Map<String, Float> scoredWowArtists = new HashMap<String, Float>();

    List<ArtistWithScore> likedArtists = getUserLikedArtists(user);
    int maxArtistsToMatch = Math.min(likedArtists.size(), 100);
    for(int i = 0; i<maxArtistsToMatch; i++) {
      Artist likedArtist = likedArtists.get(i).getArtist();

      List<ArtistWithScore> similarWowArtists = getSimilarWowArtists(likedArtist);

      for(ArtistWithScore similarWowArtist : similarWowArtists) {
        String artistName = similarWowArtist.getArtist().getName();
        Float score = scoredWowArtists.get(artistName);
        if(score == null) {
          score = 0f;
        }
        score += similarWowArtist.getScore();

        scoredWowArtists.put(artistName, score);
      }
    }

    List<ArtistWithScore> wowArtists = new ArrayList<ArtistWithScore>();
    for(Entry<String, Float> entry : scoredWowArtists.entrySet()) {
      wowArtists.add(new ArtistWithScore(entry.getKey(), entry.getValue()));
    }

    Collections.sort(wowArtists, ARTIST_WITH_SCORE_COMPARATOR);

    return wowArtists;
  }

  public Node getOrAddUser(User user) {
    Node userNode = findUserNodeByName(user.getUsername());

    if(userNode != null) {
      // nothing to do
      return userNode;
    } else {
      Node newNode = createUserNode(user);

      usersByNameIndex.add(newNode, "name", user.getUsername());

      return newNode;
    }
  }

  public Node getOrAddArtist(Artist artist) {
    return getOrAddArtist(artist, true);
  }

  private Node getOrAddArtist(Artist artist, boolean fetchSimilar) {
    Node artistNode = findArtistNodeByName(artist.getName());

    if(artistNode != null) {
      // already in graph, ignore
      return artistNode;
    } else {
      List<Artist> similarArtists = fetchSimilar ? similarArtistFinder.findSimilar(artist) : null;

      Transaction tx = graphDb.beginTx();
      try {
        System.out.println(artist + " : " + similarArtists);

        Node newNode = createArtistNode(artist);

        // add similar artists, if any
        if(similarArtists != null) {
          for(Artist similarArtist : similarArtists) {
            Node similarArtistNode = getOrAddArtist(similarArtist, false);
            if(similarArtistNode != null) {
              newNode.createRelationshipTo(similarArtistNode, TallrikRelTypes.SIMILAR);
            }
          }
        }

        // add to index
        artistsByNameIndex.add(newNode, "name", artist.getName());

        tx.success();

        return newNode;
      } finally {
        tx.finish();
      }
    }
  }

  private Path findShortestPath(Node node1, Node node2) {
    PathFinder<Path> pathFinder = GraphAlgoFactory.shortestPath(
      Traversal.expanderForTypes( TallrikRelTypes.SIMILAR, Direction.BOTH ), 5, 1);

    return pathFinder.findSinglePath(node1, node2);
  }

  public List<ArtistWithScore> getSimilarWowArtists(Artist source) {
    Node sourceNode = findArtistNodeByName(source.getName());

    if(sourceNode != null) {
      List<ArtistWithScore> scored = new ArrayList<ArtistWithScore>();
      for(Node wowArtist : wowArtistNodes) {
        Path path = findShortestPath(sourceNode, wowArtist);

        if(path != null) {
          float score = path.length() == 0 ? 10 : 1.0f/path.length();

          scored.add(new ArtistWithScore(getName(wowArtist), score));
        }
      }

      Collections.sort(scored, ARTIST_WITH_SCORE_COMPARATOR);

      return scored;
    } else {
      // TODO add?
      return Collections.emptyList();
    }
  }

  public void dump() {
    for(Node node : GlobalGraphOperations.at(graphDb).getAllNodes()) {
      if(node.hasProperty("name")) {
        System.out.println(node.getProperty("name"));
      }
    }
  }

  public boolean isEmpty() {
    return !GlobalGraphOperations.at(graphDb).getAllNodes().iterator().hasNext();
  }

}