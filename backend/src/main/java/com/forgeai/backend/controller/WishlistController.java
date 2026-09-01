package com.forgeai.backend.controller;

import com.forgeai.backend.dto.*;
import com.forgeai.backend.entity.*;
import com.forgeai.backend.repository.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final WishlistRepository wishlistRepository;
    private final WishlistItemRepository wishlistItemRepository;

    @Autowired
    public WishlistController(UserRepository userRepository,
                              ProductRepository productRepository,
                              WishlistRepository wishlistRepository,
                              WishlistItemRepository wishlistItemRepository) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.wishlistRepository = wishlistRepository;
        this.wishlistItemRepository = wishlistItemRepository;
    }

    private Long getAuthenticatedUserId(HttpServletRequest request) {
        Object attr = request.getAttribute("authenticatedUserId");
        if (attr instanceof Long) {
            return (Long) attr;
        }
        return null;
    }

    private Wishlist getOrCreateWishlistForUser(User user) {
        return wishlistRepository.findByUser(user)
                .orElseGet(() -> wishlistRepository.save(new Wishlist(user)));
    }

    private WishlistResponse convertToWishlistResponse(Wishlist wishlist) {
        List<WishlistItemResponse> itemResponses = wishlist.getItems().stream()
                .map(item -> new WishlistItemResponse(item.getId(), item.getProduct()))
                .toList();

        return new WishlistResponse(wishlist.getId(), itemResponses);
    }

    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> errorMap = new HashMap<>();
        errorMap.put("error", message);
        return errorMap;
    }

    @GetMapping
    public ResponseEntity<?> getWishlist(HttpServletRequest request) {
        Long userId = getAuthenticatedUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Unauthorized: User not authenticated."));
        }

        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("User not found."));
        }

        Wishlist wishlist = getOrCreateWishlistForUser(optionalUser.get());
        return ResponseEntity.ok(convertToWishlistResponse(wishlist));
    }

    @PostMapping("/items")
    public ResponseEntity<?> addItemToWishlist(@RequestBody AddToWishlistRequest req, HttpServletRequest request) {
        Long userId = getAuthenticatedUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Unauthorized: User not authenticated."));
        }

        if (req.getProductId() == null) {
            return ResponseEntity.badRequest().body(createErrorResponse("Product ID is required."));
        }

        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("User not found."));
        }

        Optional<Product> optionalProduct = productRepository.findById(req.getProductId());
        if (optionalProduct.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("Product not found."));
        }

        Product product = optionalProduct.get();
        if (product.getActive() == null || !product.getActive()) {
            return ResponseEntity.badRequest().body(createErrorResponse("Product is inactive."));
        }

        Wishlist wishlist = getOrCreateWishlistForUser(optionalUser.get());

        Optional<WishlistItem> optionalWishlistItem = wishlistItemRepository.findByWishlistIdAndProductId(wishlist.getId(), product.getId());

        if (optionalWishlistItem.isPresent()) {
            // Already wishlisted: Return current wishlist state to avoid creating duplicates
            return ResponseEntity.ok(convertToWishlistResponse(wishlist));
        }

        WishlistItem item = new WishlistItem(wishlist, product);
        wishlist.getItems().add(item);

        wishlistItemRepository.save(item);
        wishlistRepository.save(wishlist);

        return ResponseEntity.status(HttpStatus.CREATED).body(convertToWishlistResponse(wishlist));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<?> removeWishlistItem(@PathVariable Long itemId, HttpServletRequest request) {
        Long userId = getAuthenticatedUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Unauthorized: User not authenticated."));
        }

        Optional<WishlistItem> optionalWishlistItem = wishlistItemRepository.findById(itemId);
        if (optionalWishlistItem.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("Wishlist item not found."));
        }

        WishlistItem item = optionalWishlistItem.get();
        Wishlist wishlist = item.getWishlist();

        if (!wishlist.getUser().getId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(createErrorResponse("Unauthorized access."));
        }

        wishlist.getItems().remove(item);
        wishlistItemRepository.delete(item);
        wishlistRepository.save(wishlist);

        return ResponseEntity.ok(convertToWishlistResponse(wishlist));
    }

    @DeleteMapping
    public ResponseEntity<?> clearWishlist(HttpServletRequest request) {
        Long userId = getAuthenticatedUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Unauthorized: User not authenticated."));
        }

        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("User not found."));
        }

        Wishlist wishlist = getOrCreateWishlistForUser(optionalUser.get());
        wishlist.getItems().clear();
        wishlistRepository.save(wishlist);

        return ResponseEntity.ok(convertToWishlistResponse(wishlist));
    }
}
