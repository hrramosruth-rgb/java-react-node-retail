package demo.retail;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.concurrent.*;
import java.util.ArrayList;
import static org.assertj.core.api.Assertions.*;
@SpringBootTest(properties="spring.datasource.url=jdbc:h2:mem:concurrency;DB_CLOSE_DELAY=-1")
class InventoryConcurrencyTest {
 @Autowired InventoryService inventory;
 @Autowired JdbcTemplate jdbc;
 @Test void concurrentBuyersCannotOversell() throws Exception {
  try(var executor=Executors.newFixedThreadPool(32)) {
   for(int round=0;round<5;round++) {
    jdbc.update("DELETE FROM reservations");jdbc.update("UPDATE products SET available=12 WHERE sku='MUG'");
    var start=new CountDownLatch(1);var futures=new ArrayList<Future<Boolean>>();
    for(int i=0;i<32;i++) futures.add(executor.submit(()->{start.await();try{inventory.reserve("MUG",1);return true;}catch(IllegalStateException conflict){return false;}}));
    start.countDown();int sold=0;
    for(var f:futures) if(f.get(10,TimeUnit.SECONDS)) sold++;
    assertThat(sold).isEqualTo(12);
    assertThat(jdbc.queryForObject("SELECT available FROM products WHERE sku='MUG'",Integer.class)).isZero();
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM reservations",Integer.class)).isEqualTo(12);
   }
  }
 }
 @Test void failedReservationInsertRollsBackStock() {
  jdbc.update("DELETE FROM reservations");jdbc.update("UPDATE products SET available=12 WHERE sku='MUG'");
  jdbc.execute("ALTER TABLE reservations ADD CONSTRAINT test_limit CHECK(quantity < 2)");
  try {
   assertThatThrownBy(()->inventory.reserve("MUG",2)).isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
   assertThat(jdbc.queryForObject("SELECT available FROM products WHERE sku='MUG'",Integer.class)).isEqualTo(12);
  } finally {jdbc.execute("ALTER TABLE reservations DROP CONSTRAINT test_limit");}
 }
}
