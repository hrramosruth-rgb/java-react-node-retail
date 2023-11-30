package demo.retail;
import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api")
public class InventoryController {
 private final InventoryService inventory;
 public InventoryController(InventoryService inventory) {this.inventory=inventory;}
 public record Request(@NotBlank @Pattern(regexp="[A-Z0-9-]{1,32}") String sku, @NotNull @Min(1) @Max(100) Integer quantity) {}
 @GetMapping("/products") public List<InventoryService.Product> products() {return inventory.products();}
 @PostMapping("/reservations") @ResponseStatus(HttpStatus.CREATED)
 public InventoryService.Reservation reserve(@Valid @RequestBody Request request) {return inventory.reserve(request.sku(),request.quantity());}
}
