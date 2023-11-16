package demo.retail;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
public class InventoryService {
    public record Product(String sku, String name, int available) {}
    public record Reservation(String id, String sku, int quantity) {}
    private final JdbcTemplate jdbc;
    public InventoryService(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    public List<Product> products() {
        return jdbc.query("SELECT sku,name,available FROM products ORDER BY sku", (rs,row)->new Product(rs.getString(1),rs.getString(2),rs.getInt(3)));
    }
    @Transactional
    public Reservation reserve(String sku, int quantity) {
        if (sku == null || !sku.matches("[A-Z0-9-]{1,32}") || quantity < 1 || quantity > 100)
            throw new IllegalArgumentException("Provide a valid SKU and quantity from 1 to 100.");
        var matches = jdbc.queryForList("SELECT available FROM products WHERE sku=?", Integer.class, sku);
        if (matches.isEmpty()) throw new NoSuchElementException("Product not found.");
        if (matches.getFirst() < quantity) throw new IllegalStateException("Insufficient stock.");
        jdbc.update("UPDATE products SET available=available-? WHERE sku=?", quantity, sku);
        var reservation = new Reservation(UUID.randomUUID().toString(), sku, quantity);
        jdbc.update("INSERT INTO reservations(id,sku,quantity) VALUES(?,?,?)", reservation.id(), sku, quantity);
        return reservation;
    }
}
