package demo.retail;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;
import java.nio.file.Path;
import static org.assertj.core.api.Assertions.*;
class InventoryPersistenceTest {
 @TempDir Path directory;
 @Test void restartPreservesReservationsAndDoesNotReseedStock() {
  String url="jdbc:h2:file:"+directory.resolve("inventory");
  try(var first=new SpringApplicationBuilder(InventoryApplication.class).web(WebApplicationType.NONE).run("--spring.datasource.url="+url)) {
   first.getBean(InventoryService.class).reserve("MUG",3);
  }
  try(var second=new SpringApplicationBuilder(InventoryApplication.class).web(WebApplicationType.NONE).run("--spring.datasource.url="+url)) {
   assertThat(second.getBean(InventoryService.class).products().getFirst().available()).isEqualTo(9);
   assertThat(second.getBean(org.springframework.jdbc.core.JdbcTemplate.class).queryForObject("SELECT COUNT(*) FROM reservations",Integer.class)).isEqualTo(1);
  }
 }
}
