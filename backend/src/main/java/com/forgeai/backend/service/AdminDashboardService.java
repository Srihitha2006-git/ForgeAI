package com.forgeai.backend.service;

import com.forgeai.backend.dto.*;
import com.forgeai.backend.entity.*;
import com.forgeai.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminDashboardService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final InventoryRepository inventoryRepository;
    private final InventoryService inventoryService;
    private final InventoryTransactionRepository inventoryTransactionRepository;

    @Autowired
    public AdminDashboardService(ProductRepository productRepository,
                                 UserRepository userRepository,
                                 OrderRepository orderRepository,
                                 InventoryRepository inventoryRepository,
                                 InventoryService inventoryService,
                                 InventoryTransactionRepository inventoryTransactionRepository) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.inventoryRepository = inventoryRepository;
        this.inventoryService = inventoryService;
        this.inventoryTransactionRepository = inventoryTransactionRepository;
    }

    private void ensureInventorySynchronized() {
        long productCount = productRepository.count();
        long inventoryCount = inventoryRepository.count();
        if (inventoryCount < productCount) {
            // Synchronize inventory using existing InventoryService
            inventoryService.getAllInventories();
        }
    }

    @Transactional(readOnly = true)
    public AdminDashboardSummaryResponse getDashboardSummary() {
        ensureInventorySynchronized();

        long totalProducts = productRepository.count();
        long activeProducts = productRepository.countByActiveTrue();
        long inactiveProducts = productRepository.countByActiveFalse();

        // Strictly count users with CUSTOMER role (ADMIN users excluded)
        long totalCustomers = userRepository.countByRole(Role.CUSTOMER);

        long totalOrders = orderRepository.count();

        // Calculate revenue from valid orders (non-cancelled)
        BigDecimal totalRevenue = orderRepository.calculateTotalRevenue();
        if (totalRevenue == null) {
            totalRevenue = BigDecimal.ZERO;
        }

        long totalAvailableStock = inventoryRepository.sumAvailableStock();
        long totalReservedStock = inventoryRepository.sumReservedStock();
        long totalSoldStock = inventoryRepository.sumSoldStock();
        long lowStockProductsCount = inventoryRepository.countLowStock();

        OrderStatusCountsResponse orderStatusCounts = getOrderStatusCounts();
        List<LowStockItemDto> lowStockItems = getLowStockItems();
        List<RecentActivityDto> recentActivity = getRecentActivities();

        return new AdminDashboardSummaryResponse(
                totalProducts,
                activeProducts,
                inactiveProducts,
                totalCustomers,
                totalOrders,
                totalRevenue,
                lowStockProductsCount,
                totalAvailableStock,
                totalReservedStock,
                totalSoldStock,
                orderStatusCounts,
                lowStockItems,
                recentActivity
        );
    }

    @Transactional(readOnly = true)
    public OrderStatusCountsResponse getOrderStatusCounts() {
        List<Object[]> statusCountsList = orderRepository.countOrdersByStatus();
        Map<OrderStatus, Long> countsMap = new EnumMap<>(OrderStatus.class);

        for (OrderStatus status : OrderStatus.values()) {
            countsMap.put(status, 0L);
        }

        long total = 0L;
        if (statusCountsList != null) {
            for (Object[] row : statusCountsList) {
                if (row.length >= 2 && row[0] instanceof OrderStatus status && row[1] instanceof Long count) {
                    countsMap.put(status, count);
                    total += count;
                }
            }
        }

        return new OrderStatusCountsResponse(
                countsMap.get(OrderStatus.PLACED),
                countsMap.get(OrderStatus.CONFIRMED),
                countsMap.get(OrderStatus.PROCESSING),
                countsMap.get(OrderStatus.SHIPPED),
                countsMap.get(OrderStatus.OUT_FOR_DELIVERY),
                countsMap.get(OrderStatus.DELIVERED),
                countsMap.get(OrderStatus.CANCELLED),
                total
        );
    }

    @Transactional(readOnly = true)
    public InventorySummaryResponse getInventoryOverview() {
        ensureInventorySynchronized();

        long totalAvailableStock = inventoryRepository.sumAvailableStock();
        long totalReservedStock = inventoryRepository.sumReservedStock();
        long totalSoldStock = inventoryRepository.sumSoldStock();
        long lowStockProductsCount = inventoryRepository.countLowStock();
        List<LowStockItemDto> lowStockItems = getLowStockItems();

        return new InventorySummaryResponse(
                totalAvailableStock,
                totalReservedStock,
                totalSoldStock,
                lowStockProductsCount,
                lowStockItems
        );
    }

    @Transactional(readOnly = true)
    public List<LowStockItemDto> getLowStockItems() {
        ensureInventorySynchronized();
        List<Inventory> lowStockInventories = inventoryRepository.findLowStockInventories();
        List<LowStockItemDto> items = new ArrayList<>();

        for (Inventory inv : lowStockInventories) {
            Product p = inv.getProduct();
            if (p != null) {
                String category = p.getCategory() != null ? p.getCategory().name() : null;
                String status = inv.getStatus() != null ? inv.getStatus().name() : "LOW_STOCK";
                items.add(new LowStockItemDto(
                        p.getId(),
                        p.getName(),
                        p.getSku(),
                        category,
                        p.getImageUrl(),
                        inv.getAvailableStock(),
                        inv.getReservedStock(),
                        inv.getLowStockThreshold(),
                        status
                ));
            }
        }

        return items;
    }

    @Transactional(readOnly = true)
    public List<RecentActivityDto> getRecentActivities() {
        List<RecentActivityDto> activities = new ArrayList<>();

        // 1. Recent Orders
        List<Order> recentOrders = orderRepository.findTop10ByOrderByCreatedAtDesc();
        for (Order order : recentOrders) {
            String userName = order.getUser() != null ? order.getUser().getName() : "Customer";
            String title = "Order #" + order.getOrderNumber();
            String desc = "₹" + order.getTotalAmount() + " • " + order.getStatus() + " • " + userName;
            activities.add(new RecentActivityDto(
                    "order-" + order.getId(),
                    "ORDER",
                    title,
                    desc,
                    order.getCreatedAt(),
                    "SUCCESS"
            ));
        }

        // 2. Recent Inventory Transactions
        List<InventoryTransaction> recentTxs = inventoryTransactionRepository.findTop10ByOrderByCreatedAtDesc();
        for (InventoryTransaction tx : recentTxs) {
            String prodName = tx.getProduct() != null ? tx.getProduct().getName() : "Product";
            String sign = (tx.getQuantity() != null && tx.getQuantity() > 0) ? "+" : "";
            String title = "Stock " + tx.getTransactionType() + " (" + sign + tx.getQuantity() + ")";
            String desc = prodName + (tx.getReason() != null && !tx.getReason().isBlank() ? " • " + tx.getReason() : "");
            activities.add(new RecentActivityDto(
                    "tx-" + tx.getId(),
                    "INVENTORY",
                    title,
                    desc,
                    tx.getCreatedAt(),
                    "INFO"
            ));
        }

        // 3. Recent Customers
        List<User> recentCustomers = userRepository.findTop10ByRoleOrderByIdDesc(Role.CUSTOMER);
        for (User customer : recentCustomers) {
            activities.add(new RecentActivityDto(
                    "cust-" + customer.getId(),
                    "CUSTOMER",
                    "Customer: " + customer.getName(),
                    customer.getEmail(),
                    null, // User entity doesn't store createdAt
                    "PRIMARY"
            ));
        }

        // Sort activities: items with non-null timestamp ordered descending, followed by items with null timestamp
        activities.sort((a, b) -> {
            if (a.getTimestamp() == null && b.getTimestamp() == null) return 0;
            if (a.getTimestamp() == null) return 1;
            if (b.getTimestamp() == null) return -1;
            return b.getTimestamp().compareTo(a.getTimestamp());
        });

        // Limit to 10 most recent records
        return activities.stream().limit(10).collect(Collectors.toList());
    }
}
