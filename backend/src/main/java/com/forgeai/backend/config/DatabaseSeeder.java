package com.forgeai.backend.config;

import com.forgeai.backend.entity.Product;
import com.forgeai.backend.entity.ProductCategory;
import com.forgeai.backend.repository.ProductRepository;
import com.forgeai.backend.repository.CartItemRepository;
import com.forgeai.backend.repository.WishlistItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final ProductRepository productRepository;
    private final CartItemRepository cartItemRepository;
    private final WishlistItemRepository wishlistItemRepository;

    @Autowired
    public DatabaseSeeder(ProductRepository productRepository,
                          CartItemRepository cartItemRepository,
                          WishlistItemRepository wishlistItemRepository) {
        this.productRepository = productRepository;
        this.cartItemRepository = cartItemRepository;
        this.wishlistItemRepository = wishlistItemRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("Executing database seeder initialization check...");

        // Only seed if the products table is empty.
        // This prevents foreign key violations with orders/order_items when restarting the server.
        if (productRepository.count() > 0) {
            System.out.println("Database already seeded with products. Skipping seeder.");
            return;
        }

        List<Product> products = Arrays.asList(
            // KITCHEN_UTENSILS
            new Product(
                "Stainless Steel Cookware Set",
                "Premium 10-piece stainless steel cookware set including pots, pans, and lids. Dishwasher and oven safe.",
                new BigDecimal("189.99"),
                25,
                ProductCategory.KITCHEN_UTENSILS,
                "ChefMaster",
                "KIT-SS-COOK-10",
                "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=80&w=600&auto=format&fit=crop"
            ),
            new Product(
                "Non-Stick Frying Pan",
                "12-inch heavy-duty non-stick frying pan with ergonomic heat-resistant handle. PFOA free.",
                new BigDecimal("34.99"),
                40,
                ProductCategory.KITCHEN_UTENSILS,
                "PanPerfect",
                "KIT-NS-FRY-12",
                "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?q=80&w=600&auto=format&fit=crop"
            ),
            new Product(
                "Stainless Steel Dinner Set",
                "Elegant 24-piece stainless steel dinner set for 6 people. Perfect for daily use and hosting.",
                new BigDecimal("79.99"),
                15,
                ProductCategory.KITCHEN_UTENSILS,
                "TableGrace",
                "KIT-SS-DINE-24",
                "https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=600&auto=format&fit=crop"
            ),
            new Product(
                "Kitchen Knife Set",
                "Professional 8-piece high-carbon stainless steel kitchen knife set with wooden block organizer.",
                new BigDecimal("129.99"),
                20,
                ProductCategory.KITCHEN_UTENSILS,
                "EdgePro",
                "KIT-KN-SET-08",
                "https://images.unsplash.com/photo-1593113630400-ea4288922497?q=80&w=600&auto=format&fit=crop"
            ),
            new Product(
                "Premium Cutlery Set",
                "Modern 20-piece polished silver cutlery set including forks, knives, and spoons. Premium finish.",
                new BigDecimal("49.99"),
                30,
                ProductCategory.KITCHEN_UTENSILS,
                "SilverSleek",
                "KIT-CUT-PREM-20",
                "https://images.unsplash.com/photo-1543510473-ac2c35329a28?q=80&w=600&auto=format&fit=crop"
            ),
            new Product(
                "Pressure Cooker",
                "6-liter hard anodized aluminum pressure cooker with safety valve and ergonomic handle.",
                new BigDecimal("59.99"),
                18,
                ProductCategory.KITCHEN_UTENSILS,
                "TurboSteam",
                "KIT-PRES-COOK-06",
                "https://images.unsplash.com/photo-1578643463396-0997cb5328c1?q=80&w=600&auto=format&fit=crop"
            ),

            // FURNITURE
            new Product(
                "Ergonomic Office Chair",
                "Mesh back ergonomic office chair with adjustable lumbar support, 3D armrests, and synchro-tilt mechanism.",
                new BigDecimal("249.99"),
                15,
                ProductCategory.FURNITURE,
                "SitWell",
                "FUR-ERG-CHAIR-01",
                "https://images.unsplash.com/photo-1505797149-43b0069ec26b?q=80&w=600&auto=format&fit=crop"
            ),
            new Product(
                "Executive Office Chair",
                "Premium bonded leather executive chair with padded armrests, tilt mechanism, and solid chrome base.",
                new BigDecimal("329.99"),
                10,
                ProductCategory.FURNITURE,
                "LuxLounge",
                "FUR-EXEC-CHAIR-02",
                "https://images.unsplash.com/photo-1580481072645-022f9a6dbf27?q=80&w=600&auto=format&fit=crop"
            ),
            new Product(
                "Wooden Study Table",
                "Solid oak study desk with 2 storage drawers and sleek metal legs. Modern minimalist design.",
                new BigDecimal("199.99"),
                12,
                ProductCategory.FURNITURE,
                "OakHearth",
                "FUR-WOOD-DESK-03",
                "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=600&auto=format&fit=crop"
            ),
            new Product(
                "Executive Office Desk",
                "L-shaped executive office desk with integrated cable management, keyboard tray, and file drawer.",
                new BigDecimal("449.99"),
                8,
                ProductCategory.FURNITURE,
                "ProWork",
                "FUR-EXEC-DESK-04",
                "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=600&auto=format&fit=crop"
            ),
            new Product(
                "Modern Bookshelf",
                "5-shelf industrial style open bookshelf with heavy steel frame and rustic wooden display shelves.",
                new BigDecimal("119.99"),
                22,
                ProductCategory.FURNITURE,
                "Symmetry",
                "FUR-MOD-BOOK-05",
                "https://images.unsplash.com/photo-1594620302200-9a762244a156?q=80&w=600&auto=format&fit=crop"
            ),
            new Product(
                "Filing Cabinet",
                "3-drawer mobile metal filing cabinet with lock and key system, designed for standard file folders.",
                new BigDecimal("89.99"),
                35,
                ProductCategory.FURNITURE,
                "SecurOrganize",
                "FUR-FILE-CAB-06",
                "https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=600&auto=format&fit=crop"
            ),

            // OFFICE_ENTERPRISE
            new Product(
                "Business Laptop Stand",
                "Ergonomic adjustable aluminum laptop stand with heat-ventilating design, fits 10-17 inch devices.",
                new BigDecimal("29.99"),
                50,
                ProductCategory.OFFICE_ENTERPRISE,
                "FlexiLift",
                "OFF-LAP-STAND-01",
                "https://images.unsplash.com/photo-1616440347437-b1c73416efc2?q=80&w=600&auto=format&fit=crop"
            ),
            new Product(
                "Office Workstation Divider",
                "Acoustic desk partition and workstation divider panel, noise-reducing fabric finish.",
                new BigDecimal("69.99"),
                25,
                ProductCategory.OFFICE_ENTERPRISE,
                "QuietSpace",
                "OFF-WORK-DIV-02",
                "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?q=80&w=600&auto=format&fit=crop"
            ),
            new Product(
                "Document Storage Organizer",
                "Desktop document storage organizer tray with 4 sliding mesh trays for office file sorting.",
                new BigDecimal("19.99"),
                60,
                ProductCategory.OFFICE_ENTERPRISE,
                "SortRite",
                "OFF-DOC-ORG-03",
                "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=600&auto=format&fit=crop"
            ),
            new Product(
                "Enterprise Filing System",
                "Heavy-duty enterprise storage boxes for archive storage and organization, package of 10 boxes.",
                new BigDecimal("39.99"),
                80,
                ProductCategory.OFFICE_ENTERPRISE,
                "RecordKeep",
                "OFF-ENT-FILE-04",
                "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=600&auto=format&fit=crop"
            ),
            new Product(
                "Reception Desk Counter",
                "Modern receptionist counter desk with high-gloss laminate finish panel and glass transaction counter.",
                new BigDecimal("799.99"),
                4,
                ProductCategory.OFFICE_ENTERPRISE,
                "FirstImpress",
                "OFF-RECEP-DESK-05",
                "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600&auto=format&fit=crop"
            ),
            new Product(
                "Meeting Room Table",
                "8-foot modular meeting room table with built-in AC power outlets, USB ports, and wire guides.",
                new BigDecimal("599.99"),
                6,
                ProductCategory.OFFICE_ENTERPRISE,
                "CollabBoard",
                "OFF-MEET-TAB-06",
                "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=600&auto=format&fit=crop"
            )
        );

        productRepository.saveAll(products);
        System.out.println("Successfully seeded database with " + products.size() + " home & enterprise marketplace products.");
    }
}
