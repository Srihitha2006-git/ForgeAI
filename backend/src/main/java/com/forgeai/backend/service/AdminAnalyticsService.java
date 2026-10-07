package com.forgeai.backend.service;

import com.forgeai.backend.dto.*;
import com.forgeai.backend.entity.OrderStatus;
import com.forgeai.backend.entity.ProductCategory;
import com.forgeai.backend.entity.Role;
import com.forgeai.backend.repository.InventoryRepository;
import com.forgeai.backend.repository.OrderItemRepository;
import com.forgeai.backend.repository.OrderRepository;
import com.forgeai.backend.repository.ProductRepository;
import com.forgeai.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class AdminAnalyticsService {

    private static final String REVENUE_CALCULATION_RULE =
            "Total revenue is calculated as the sum of totalAmount for all non-cancelled orders (status <> CANCELLED). " +
            "Delivered revenue reflects orders marked as DELIVERED.";

    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final InventoryService inventoryService;

    @Autowired
    public AdminAnalyticsService(ProductRepository productRepository,
                                 InventoryRepository inventoryRepository,
                                 OrderRepository orderRepository,
                                 OrderItemRepository orderItemRepository,
                                 UserRepository userRepository,
                                 InventoryService inventoryService) {
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.userRepository = userRepository;
        this.inventoryService = inventoryService;
    }

    private void ensureInventorySynchronized() {
        long productCount = productRepository.count();
        long inventoryCount = inventoryRepository.count();
        if (inventoryCount < productCount) {
            inventoryService.getAllInventories();
        }
    }

    @Transactional(readOnly = true)
    public AdminAnalyticsSummaryResponse getAnalyticsSummary() {
        SalesAnalyticsDto sales = getSalesAnalytics();
        OrderStatusAnalyticsDto orderStatus = getOrderStatusAnalytics();
        ProductAnalyticsDto products = getProductAnalytics();
        InventoryAnalyticsDto inventory = getInventoryAnalytics();
        CustomerAnalyticsDto customers = getCustomerAnalytics();
        List<DailySalesTrendDto> dailySalesTrend = getDailySalesTrend();
        List<TopProductDto> topProducts = getTopSellingProducts();

        long totalOrders = sales.getTotalOrders();
        BigDecimal totalRevenue = sales.getTotalRevenue();
        long totalProductsCount = products.getTotalProducts();
        long totalCustomersCount = customers.getTotalCustomers();
        long pendingOrders = orderStatus.getPending() + orderStatus.getPlaced() + orderStatus.getProcessing();
        long deliveredOrders = orderStatus.getDelivered();

        return new AdminAnalyticsSummaryResponse(
                totalOrders,
                totalRevenue,
                totalProductsCount,
                totalCustomersCount,
                pendingOrders,
                deliveredOrders,
                sales,
                orderStatus,
                products,
                inventory,
                customers,
                dailySalesTrend,
                topProducts
        );
    }

    @Transactional(readOnly = true)
    public SalesAnalyticsDto getSalesAnalytics() {
        long totalOrders = orderRepository.count();
        long deliveredOrders = orderRepository.countByStatus(OrderStatus.DELIVERED);
        long cancelledOrders = orderRepository.countByStatus(OrderStatus.CANCELLED);
        long nonCancelledOrders = totalOrders - cancelledOrders;
        if (nonCancelledOrders < 0) {
            nonCancelledOrders = 0;
        }

        BigDecimal totalRevenue = orderRepository.calculateTotalRevenue();
        if (totalRevenue == null) {
            totalRevenue = BigDecimal.ZERO;
        }

        BigDecimal deliveredRevenue = orderRepository.calculateDeliveredRevenue();
        if (deliveredRevenue == null) {
            deliveredRevenue = BigDecimal.ZERO;
        }

        BigDecimal avgOrderValue = BigDecimal.ZERO;
        if (nonCancelledOrders > 0 && totalRevenue.compareTo(BigDecimal.ZERO) > 0) {
            avgOrderValue = totalRevenue.divide(BigDecimal.valueOf(nonCancelledOrders), 2, RoundingMode.HALF_UP);
        }

        return new SalesAnalyticsDto(
                totalRevenue,
                deliveredRevenue,
                totalOrders,
                deliveredOrders,
                nonCancelledOrders,
                cancelledOrders,
                avgOrderValue,
                REVENUE_CALCULATION_RULE
        );
    }

    @Transactional(readOnly = true)
    public OrderStatusAnalyticsDto getOrderStatusAnalytics() {
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

        Map<String, Long> statusBreakdown = new LinkedHashMap<>();
        for (OrderStatus status : OrderStatus.values()) {
            statusBreakdown.put(status.name(), countsMap.get(status));
        }

        return new OrderStatusAnalyticsDto(
                countsMap.get(OrderStatus.PENDING),
                countsMap.get(OrderStatus.PLACED),
                countsMap.get(OrderStatus.CONFIRMED),
                countsMap.get(OrderStatus.PACKED),
                countsMap.get(OrderStatus.PROCESSING),
                countsMap.get(OrderStatus.SHIPPED),
                countsMap.get(OrderStatus.OUT_FOR_DELIVERY),
                countsMap.get(OrderStatus.DELIVERED),
                countsMap.get(OrderStatus.CANCELLED),
                total,
                statusBreakdown
        );
    }

    @Transactional(readOnly = true)
    public ProductAnalyticsDto getProductAnalytics() {
        ensureInventorySynchronized();

        long totalProducts = productRepository.count();
        long activeProducts = productRepository.countByActiveTrue();
        long inactiveProducts = productRepository.countByActiveFalse();
        long lowStockCount = inventoryRepository.countLowStock() != null ? inventoryRepository.countLowStock() : 0L;
        long outOfStockCount = inventoryRepository.countOutOfStock() != null ? inventoryRepository.countOutOfStock() : 0L;

        Map<String, Long> categoryBreakdown = new LinkedHashMap<>();
        List<Object[]> catRows = productRepository.countProductsByCategory();
        if (catRows != null) {
            for (Object[] row : catRows) {
                if (row.length >= 2 && row[0] instanceof ProductCategory cat && row[1] instanceof Long count) {
                    categoryBreakdown.put(cat.name(), count);
                }
            }
        }

        return new ProductAnalyticsDto(
                totalProducts,
                activeProducts,
                inactiveProducts,
                lowStockCount,
                outOfStockCount,
                categoryBreakdown
        );
    }

    @Transactional(readOnly = true)
    public InventoryAnalyticsDto getInventoryAnalytics() {
        ensureInventorySynchronized();

        Long avail = inventoryRepository.sumAvailableStock();
        Long res = inventoryRepository.sumReservedStock();
        Long sold = inventoryRepository.sumSoldStock();
        Long low = inventoryRepository.countLowStock();
        Long out = inventoryRepository.countOutOfStock();

        return new InventoryAnalyticsDto(
                avail != null ? avail : 0L,
                res != null ? res : 0L,
                sold != null ? sold : 0L,
                low != null ? low : 0L,
                out != null ? out : 0L
        );
    }

    @Transactional(readOnly = true)
    public CustomerAnalyticsDto getCustomerAnalytics() {
        long totalUsers = userRepository.count();
        long totalCustomers = userRepository.countByRole(Role.CUSTOMER);
        long totalAdmins = userRepository.countByRole(Role.ADMIN);

        return new CustomerAnalyticsDto(
                totalUsers,
                totalCustomers,
                totalAdmins
        );
    }

    @Transactional(readOnly = true)
    public List<DailySalesTrendDto> getDailySalesTrend() {
        var orders = orderRepository.findAllByOrderByCreatedAtAsc();
        if (orders == null || orders.isEmpty()) {
            return Collections.emptyList();
        }

        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE;
        Map<String, BigDecimal> revenueByDate = new LinkedHashMap<>();
        Map<String, Long> countByDate = new LinkedHashMap<>();

        for (var order : orders) {
            if (order.getStatus() == OrderStatus.CANCELLED || order.getCreatedAt() == null) {
                continue;
            }
            String dateKey = formatter.format(order.getCreatedAt());
            BigDecimal amount = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;

            revenueByDate.put(dateKey, revenueByDate.getOrDefault(dateKey, BigDecimal.ZERO).add(amount));
            countByDate.put(dateKey, countByDate.getOrDefault(dateKey, 0L) + 1L);
        }

        List<DailySalesTrendDto> trendList = new ArrayList<>();
        for (String dateKey : revenueByDate.keySet()) {
            trendList.add(new DailySalesTrendDto(
                    dateKey,
                    revenueByDate.get(dateKey),
                    countByDate.get(dateKey)
            ));
        }

        return trendList;
    }

    @Transactional(readOnly = true)
    public List<TopProductDto> getTopSellingProducts() {
        List<Object[]> rows = orderItemRepository.findTopSellingProducts();
        if (rows == null || rows.isEmpty()) {
            return Collections.emptyList();
        }

        List<TopProductDto> topList = new ArrayList<>();
        int rank = 1;
        for (Object[] row : rows) {
            if (row.length >= 6) {
                Long productId = (Long) row[0];
                String productName = (String) row[1];
                ProductCategory cat = (ProductCategory) row[2];
                String category = cat != null ? cat.name() : "N/A";
                String imageUrl = (String) row[3];
                Long quantitySold = row[4] != null ? ((Number) row[4]).longValue() : 0L;
                BigDecimal revenue = row[5] != null ? (BigDecimal) row[5] : BigDecimal.ZERO;

                topList.add(new TopProductDto(
                        rank++,
                        productId,
                        productName,
                        category,
                        imageUrl,
                        quantitySold,
                        revenue
                ));

                if (rank > 10) {
                    break;
                }
            }
        }

        return topList;
    }
}
