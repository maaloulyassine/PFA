import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class CreateTestAdmin {
    public static void main(String[] args) throws Exception {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String password = encoder.encode("password");
        
        String url = "jdbc:postgresql://localhost:5432/helpdesk_db";
        try (Connection conn = DriverManager.getConnection(url, "helpdesk_user", "helpdesk_pass")) {
            System.out.println("Deleteting old...");
            conn.createStatement().execute("DELETE FROM hd_users WHERE email='admin@helpdesk.com'");
            
            String sql = "INSERT INTO hd_users (email, password, first_name, last_name, role, enabled) VALUES (?, ?, 'Admin', 'Test', 'ADMIN', true)";
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, "admin@helpdesk.com");
                stmt.setString(2, password);
                stmt.executeUpdate();
                System.out.println("Clean test admin inserted successfully. password=password");
            }
        }
    }
}
