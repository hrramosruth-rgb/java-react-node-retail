package demo.retail;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import static org.assertj.core.api.Assertions.*;
@SpringBootTest(properties="spring.datasource.url=jdbc:h2:mem:domain;DB_CLOSE_DELAY=-1")
class InventoryServiceTest {
 @Autowired InventoryService inventory;
 @Test void seededCatalogIsReproducible() { assertThat(inventory.products()).extracting(InventoryService.Product::sku).containsExactly("MUG", "TOTE"); }
 @Test void reservationDecrementsAvailableStock() {
  var result=inventory.reserve("TOTE",2);
  assertThat(result.quantity()).isEqualTo(2);
  assertThat(inventory.products().stream().filter(p->p.sku().equals("TOTE")).findFirst().orElseThrow().available()).isEqualTo(6);
 }
 @Test void invalidQuantityDoesNotMutateStock() {
  var before=inventory.products();
  assertThatThrownBy(()->inventory.reserve("MUG",0)).isInstanceOf(IllegalArgumentException.class);
  assertThatThrownBy(()->inventory.reserve("MUG",-1)).isInstanceOf(IllegalArgumentException.class);
  assertThatThrownBy(()->inventory.reserve("MUG",101)).isInstanceOf(IllegalArgumentException.class);
  assertThat(inventory.products()).isEqualTo(before);
 }
 @Test void unknownProductIsRejected() { assertThatThrownBy(()->inventory.reserve("NOPE",1)).isInstanceOf(java.util.NoSuchElementException.class); }
 @Test void insufficientStockDoesNotMutateStock() {
  var before=inventory.products();
  assertThatThrownBy(()->inventory.reserve("MUG",99)).isInstanceOf(IllegalStateException.class);
  assertThat(inventory.products()).isEqualTo(before);
 }
}
