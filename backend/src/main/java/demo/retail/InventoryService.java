package demo.retail;
import java.util.List;
import org.springframework.stereotype.Service;
@Service
public class InventoryService {
    public record Product(String sku, String name, int available) {}
    public record Reservation(String id, String sku, int quantity) {}
    public List<Product> products() { return List.of(); }
    public Reservation reserve(String sku, int quantity) { throw new UnsupportedOperationException("Not implemented"); }
}
