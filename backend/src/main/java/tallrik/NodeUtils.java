package tallrik;

import java.util.Iterator;

import org.neo4j.graphdb.Direction;
import org.neo4j.graphdb.Node;
import org.neo4j.graphdb.Relationship;
import org.neo4j.graphdb.RelationshipType;

public class NodeUtils {

  public static boolean areConnected(Node n1,Node n2, RelationshipType relType,Direction dir) {

    Direction dir2 = null;
    if(dir.equals(Direction.INCOMING)) {
      dir2 = Direction.OUTGOING;
    } else if(dir.equals(Direction.OUTGOING)) {
      dir2 = Direction.INCOMING;
    } else {
      dir2 = Direction.BOTH;
    }

    Iterator<Relationship> rels1 = n1.getRelationships(relType, dir).iterator();
    Iterator<Relationship> rels2 = n2.getRelationships(relType, dir2).iterator();

    while(rels1.hasNext() && rels2.hasNext()){
      Relationship rel1 = rels1.next();
      Relationship rel2 = rels2.next();

      if (rel1.getEndNode().equals(n2)) {
        return true;
      } else if (rel2.getEndNode().equals(n1)) {
        return true;
      }
    }
    return false;
   }


}
