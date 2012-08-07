package tallrik;

import org.neo4j.graphdb.RelationshipType;

enum TallrikRelTypes implements RelationshipType {
    SIMILAR, LIKES
}