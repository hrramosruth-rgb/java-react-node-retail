package demo.retail;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
@SpringBootTest(properties="spring.datasource.url=jdbc:h2:mem:api;DB_CLOSE_DELAY=-1")
@AutoConfigureMockMvc
class InventoryApiTest {
 @Autowired MockMvc mvc;
 @Test void catalogReturnsInventory() throws Exception {mvc.perform(get("/api/products")).andExpect(status().isOk()).andExpect(jsonPath("$[0].sku").value("MUG"));}
 @Test void reservationReturnsCreatedAndMutatesStock() throws Exception {
  mvc.perform(post("/api/reservations").contentType("application/json").content("{\"sku\":\"TOTE\",\"quantity\":1}")).andExpect(status().isCreated()).andExpect(jsonPath("$.quantity").value(1));
  mvc.perform(get("/api/products")).andExpect(jsonPath("$[1].available").value(7));
 }
 @Test void invalidInputsReturn400() throws Exception {
  for(String body:new String[]{"{}","{\"sku\":\"MUG\",\"quantity\":0}","{\"sku\":\"MUG\",\"quantity\":1.5}","{\"sku\":\"MUG\",\"quantity\":\"2\"}","{bad"})
   mvc.perform(post("/api/reservations").contentType("application/json").content(body)).andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").isString());
 }
 @Test void missingProductReturns404() throws Exception {mvc.perform(post("/api/reservations").contentType("application/json").content("{\"sku\":\"NOPE\",\"quantity\":1}")).andExpect(status().isNotFound());}
 @Test void stockConflictReturns409() throws Exception {mvc.perform(post("/api/reservations").contentType("application/json").content("{\"sku\":\"MUG\",\"quantity\":99}")).andExpect(status().isConflict());}
}
