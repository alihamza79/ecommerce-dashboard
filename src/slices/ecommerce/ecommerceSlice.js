// src/slices/ecommerceSlice.js

import { createSlice } from "@reduxjs/toolkit";
import { getOrders, updateOrder, deleteOrder } from "./thunks";

const initialState = {
  orders: [],
  isOrderSuccess: false,
  error: null,
  loading: false,
};

const ecommerceSlice = createSlice({
  name: "Ecommerce",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Handle fetching orders
      .addCase(getOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
        state.isOrderSuccess = true;
      })
      .addCase(getOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isOrderSuccess = false;
      })

      // Handle updating orders
      .addCase(updateOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.isOrderSuccess = true;
        state.error = null;
        const index = state.orders.findIndex((order) => order._id === action.payload._id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      })
      .addCase(updateOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isOrderSuccess = false;
      })

      // Handle deleting orders
      .addCase(deleteOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.isOrderSuccess = true;
        state.error = null;
        state.orders = state.orders.filter((order) => order._id !== action.payload);
      })
      .addCase(deleteOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isOrderSuccess = false;
      });
  },
});

export default ecommerceSlice.reducer;
