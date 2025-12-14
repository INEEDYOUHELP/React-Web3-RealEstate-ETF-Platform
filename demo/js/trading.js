// 交易中心管理类
class TradingManager {
    constructor() {
        this.selectedAsset = null;
        this.orderType = 'market';
        this.tradeType = 'buy';
        this.currentTab = 'open-orders';
        
        // 模拟资产数据
        this.assets = [
            {
                id: 1,
                symbol: 'NYC-COMM',
                name: '纽约曼哈顿商业区',
                price: 108.50,
                change: 2.30,
                changePercent: 2.16,
                volume: 1234567,
                marketCap: 125000000
            },
            {
                id: 2,
                symbol: 'LON-FIN',
                name: '伦敦金融城办公区',
                price: 95.20,
                change: -1.80,
                changePercent: -1.86,
                volume: 987654,
                marketCap: 98000000
            },
            {
                id: 3,
                symbol: 'TOK-GIN',
                name: '东京银座商业区',
                price: 87.30,
                change: 0.90,
                changePercent: 1.04,
                volume: 756432,
                marketCap: 87000000
            },
            {
                id: 4,
                symbol: 'SIN-CBD',
                name: '新加坡CBD写字楼',
                price: 112.80,
                change: 4.20,
                changePercent: 3.87,
                volume: 654321,
                marketCap: 156000000
            },
            {
                id: 5,
                symbol: 'DUB-BIZ',
                name: '迪拜商业中心',
                price: 132.40,
                change: 8.60,
                changePercent: 6.95,
                volume: 432198,
                marketCap: 178000000
            }
        ];

        // 模拟订单数据
        this.openOrders = [
            {
                id: 1,
                time: '10:30:25',
                asset: 'NYC-COMM',
                type: 'buy',
                quantity: 100,
                price: 107.50,
                status: 'pending'
            },
            {
                id: 2,
                time: '09:45:12',
                asset: 'SIN-CBD',
                type: 'sell',
                quantity: 50,
                price: 115.00,
                status: 'partial'
            }
        ];

        this.orderHistory = [
            {
                id: 1,
                time: '2024-03-15 14:30',
                asset: 'NYC-COMM',
                type: 'buy',
                quantity: 200,
                price: 105.20,
                fee: 5.26,
                status: 'completed'
            },
            {
                id: 2,
                time: '2024-03-14 11:15',
                asset: 'LON-FIN',
                type: 'sell',
                quantity: 150,
                price: 96.80,
                fee: 7.26,
                status: 'completed'
            },
            {
                id: 3,
                time: '2024-03-13 16:45',
                asset: 'TOK-GIN',
                type: 'buy',
                quantity: 300,
                price: 86.50,
                fee: 12.98,
                status: 'completed'
            }
        ];

        // 模拟持仓数据
        this.positions = [
            {
                asset: 'NYC-COMM',
                name: '纽约曼哈顿商业区',
                quantity: 450,
                avgPrice: 105.80,
                currentPrice: 108.50,
                unrealizedPL: 1215.00,
                unrealizedPLPercent: 2.55
            },
            {
                asset: 'SIN-CBD',
                name: '新加坡CBD写字楼',
                quantity: 200,
                avgPrice: 110.20,
                currentPrice: 112.80,
                unrealizedPL: 520.00,
                unrealizedPLPercent: 2.36
            }
        ];

        this.init();
    }

    init() {
        this.renderAssetList();
        this.renderPriceTicker();
        this.renderOrderTables();
        this.renderPositions();
        this.renderOrderBook();
        this.bindEvents();
        this.startPriceUpdates();
        this.updateMarketTime();
    }

    bindEvents() {
        // 标签页切换
        const tradeTabs = document.querySelectorAll('.tab-btn');
        tradeTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTradeType(e.target.dataset.type);
            });
        });

        // 订单类型切换
        const orderTypeSelect = document.getElementById('orderType');
        if (orderTypeSelect) {
            orderTypeSelect.addEventListener('change', (e) => {
                this.orderType = e.target.value;
                this.togglePriceInput();
            });
        }

        // 数量输入
        const quantityInput = document.getElementById('quantity');
        if (quantityInput) {
            quantityInput.addEventListener('input', () => this.updateEstimatedAmount());
        }

        // 价格输入
        const priceInput = document.getElementById('price');
        if (priceInput) {
            priceInput.addEventListener('input', () => this.updateEstimatedAmount());
        }

        // 执行交易按钮
        const executeBtn = document.getElementById('executeTradeBtn');
        if (executeBtn) {
            executeBtn.addEventListener('click', () => this.executeTrade());
        }

        // 管理标签页
        const managementTabs = document.querySelectorAll('.management-tabs .tab');
        managementTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchManagementTab(e.target.dataset.tab);
            });
        });

        // 资产搜索
        const searchInput = document.querySelector('.search-bar input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterAssets(e.target.value);
            });
        }
    }

    renderAssetList() {
        const assetList = document.getElementById('tradingAssetList');
        if (!assetList) return;

        assetList.innerHTML = this.assets.map(asset => `
            <div class="asset-item" data-asset-id="${asset.id}">
                <div class="asset-name">${asset.name}</div>
                <div class="asset-price">
                    <span class="price-value">$${asset.price.toFixed(2)}</span>
                    <span class="price-change ${asset.change >= 0 ? 'positive' : 'negative'}">
                        ${asset.change >= 0 ? '+' : ''}${asset.change.toFixed(2)} (${asset.changePercent.toFixed(2)}%)
                    </span>
                </div>
            </div>
        `).join('');

        // 绑定点击事件
        assetList.querySelectorAll('.asset-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const assetId = parseInt(e.currentTarget.dataset.assetId);
                this.selectAsset(assetId);
            });
        });
    }

    renderPriceTicker() {
        const ticker = document.getElementById('priceTicker');
        if (!ticker) return;

        ticker.innerHTML = this.assets.map(asset => `
            <div class="ticker-item">
                <div>
                    <div class="ticker-symbol">${asset.symbol}</div>
                    <div class="ticker-volume">Vol: ${this.formatNumber(asset.volume)}</div>
                </div>
                <div class="ticker-price">
                    <div class="price-value">$${asset.price.toFixed(2)}</div>
                    <div class="price-change ${asset.change >= 0 ? 'positive' : 'negative'}">
                        ${asset.change >= 0 ? '+' : ''}${asset.changePercent.toFixed(2)}%
                    </div>
                </div>
            </div>
        `).join('');
    }

    selectAsset(assetId) {
        this.selectedAsset = this.assets.find(a => a.id === assetId);
        
        // 更新UI
        document.querySelectorAll('.asset-item').forEach(item => {
            item.classList.remove('selected');
        });
        document.querySelector(`[data-asset-id="${assetId}"]`).classList.add('selected');

        // 更新选中资产显示
        const selectedAssetDiv = document.getElementById('selectedAsset');
        if (selectedAssetDiv && this.selectedAsset) {
            selectedAssetDiv.innerHTML = `
                <div class="asset-info">
                    <h4>${this.selectedAsset.name}</h4>
                    <div class="asset-details">
                        <span>当前价格: $${this.selectedAsset.price.toFixed(2)}</span>
                        <span class="price-change ${this.selectedAsset.change >= 0 ? 'positive' : 'negative'}">
                            ${this.selectedAsset.change >= 0 ? '+' : ''}${this.selectedAsset.change.toFixed(2)} (${this.selectedAsset.changePercent.toFixed(2)}%)
                        </span>
                    </div>
                </div>
            `;
        }

        this.updateEstimatedAmount();
        this.updateTradeButton();
    }

    switchTradeType(type) {
        this.tradeType = type;
        
        // 更新按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-type="${type}"]`).classList.add('active');

        // 更新交易按钮文本
        const executeBtn = document.getElementById('executeTradeBtn');
        if (executeBtn) {
            executeBtn.innerHTML = `
                <i class="fas fa-exchange-alt"></i>
                ${type === 'buy' ? '买入' : '卖出'}
            `;
            executeBtn.className = `btn-trade ${type}`;
        }

        this.updateEstimatedAmount();
    }

    togglePriceInput() {
        const priceGroup = document.getElementById('priceGroup');
        if (priceGroup) {
            priceGroup.style.display = this.orderType === 'limit' ? 'block' : 'none';
        }
        this.updateEstimatedAmount();
    }

    updateEstimatedAmount() {
        if (!this.selectedAsset) return;

        const quantity = parseFloat(document.getElementById('quantity').value) || 0;
        let price = this.selectedAsset.price;
        
        if (this.orderType === 'limit') {
            price = parseFloat(document.getElementById('price').value) || this.selectedAsset.price;
        }

        const amount = quantity * price;
        const fee = amount * 0.005; // 0.5% fee
        const gasFee = 5.00;
        const total = this.tradeType === 'buy' ? amount + fee + gasFee : amount - fee - gasFee;

        document.getElementById('estimatedAmount').textContent = `$${amount.toFixed(2)}`;
        document.getElementById('tradingFee').textContent = `$${fee.toFixed(2)}`;
        document.getElementById('totalAmount').textContent = `$${total.toFixed(2)}`;

        this.updateTradeButton();
    }

    updateTradeButton() {
        const executeBtn = document.getElementById('executeTradeBtn');
        const quantity = parseFloat(document.getElementById('quantity').value) || 0;
        
        if (executeBtn) {
            executeBtn.disabled = !this.selectedAsset || quantity <= 0;
        }
    }

    executeTrade() {
        if (!this.selectedAsset) {
            window.realEstateETF?.showNotification('请选择要交易的资产', 'warning');
            return;
        }

        if (!window.realEstateETF?.walletConnected) {
            window.realEstateETF?.showNotification('请先连接钱包', 'warning');
            return;
        }

        const quantity = parseFloat(document.getElementById('quantity').value);
        let price = this.selectedAsset.price;
        
        if (this.orderType === 'limit') {
            price = parseFloat(document.getElementById('price').value) || this.selectedAsset.price;
        }

        if (quantity <= 0) {
            window.realEstateETF?.showNotification('请输入有效的交易数量', 'warning');
            return;
        }

        // 显示确认对话框
        this.showTradeConfirmation(quantity, price);
    }

    showTradeConfirmation(quantity, price) {
        const amount = quantity * price;
        const fee = amount * 0.005;
        const total = this.tradeType === 'buy' ? amount + fee + 5 : amount - fee - 5;

        const modal = window.realEstateETF?.createModal('确认交易', `
            <div class="trade-confirmation">
                <div class="trade-summary">
                    <h4>${this.tradeType === 'buy' ? '买入' : '卖出'} ${this.selectedAsset.name}</h4>
                    <div class="summary-details">
                        <div class="detail-row">
                            <span>交易类型:</span>
                            <span>${this.orderType === 'market' ? '市价单' : '限价单'}</span>
                        </div>
                        <div class="detail-row">
                            <span>数量:</span>
                            <span>${quantity} 份</span>
                        </div>
                        <div class="detail-row">
                            <span>价格:</span>
                            <span>$${price.toFixed(2)}</span>
                        </div>
                        <div class="detail-row">
                            <span>交易金额:</span>
                            <span>$${amount.toFixed(2)}</span>
                        </div>
                        <div class="detail-row">
                            <span>手续费:</span>
                            <span>$${fee.toFixed(2)}</span>
                        </div>
                        <div class="detail-row">
                            <span>网络费:</span>
                            <span>$5.00</span>
                        </div>
                        <div class="detail-row total">
                            <span>总计:</span>
                            <span>$${total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                <div class="confirmation-actions">
                    <button class="btn btn-outline" onclick="window.realEstateETF.closeModal()">
                        取消
                    </button>
                    <button class="btn btn-primary" onclick="window.tradingManager.processTradeExecution(${quantity}, ${price})">
                        确认${this.tradeType === 'buy' ? '买入' : '卖出'}
                    </button>
                </div>
            </div>
        `);
    }

    processTradeExecution(quantity, price) {
        window.realEstateETF?.showNotification('正在处理交易...', 'info');
        
        setTimeout(() => {
            // 创建新订单
            const newOrder = {
                id: this.openOrders.length + 1,
                time: new Date().toLocaleTimeString(),
                asset: this.selectedAsset.symbol,
                type: this.tradeType,
                quantity: quantity,
                price: price,
                status: this.orderType === 'market' ? 'completed' : 'pending'
            };

            if (this.orderType === 'market') {
                // 市价单立即执行
                this.orderHistory.unshift({
                    id: this.orderHistory.length + 1,
                    time: new Date().toLocaleString(),
                    asset: this.selectedAsset.symbol,
                    type: this.tradeType,
                    quantity: quantity,
                    price: price,
                    fee: (quantity * price * 0.005).toFixed(2),
                    status: 'completed'
                });
                
                window.realEstateETF?.showNotification(
                    `${this.tradeType === 'buy' ? '买入' : '卖出'}成功！数量: ${quantity} 份，价格: $${price.toFixed(2)}`,
                    'success'
                );
            } else {
                // 限价单加入待成交订单
                this.openOrders.unshift(newOrder);
                window.realEstateETF?.showNotification(
                    `限价单已提交！等待成交...`,
                    'success'
                );
            }

            // 清空表单
            document.getElementById('quantity').value = '';
            document.getElementById('price').value = '';
            
            // 更新显示
            this.renderOrderTables();
            this.updateEstimatedAmount();
            
            window.realEstateETF?.closeModal();
        }, 2000);
    }

    renderOrderTables() {
        // 渲染未完成订单
        const openOrdersTable = document.getElementById('openOrdersTable');
        if (openOrdersTable) {
            openOrdersTable.innerHTML = this.openOrders.map(order => `
                <tr>
                    <td>${order.time}</td>
                    <td>${order.asset}</td>
                    <td>
                        <span class="order-type ${order.type}">${order.type === 'buy' ? '买入' : '卖出'}</span>
                    </td>
                    <td>${order.quantity}</td>
                    <td>$${order.price.toFixed(2)}</td>
                    <td>
                        <span class="status ${order.status}">${this.getStatusLabel(order.status)}</span>
                    </td>
                    <td>
                        <button class="action-btn" onclick="tradingManager.cancelOrder(${order.id})">
                            取消
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        // 渲染交易历史
        const orderHistoryTable = document.getElementById('orderHistoryTable');
        if (orderHistoryTable) {
            orderHistoryTable.innerHTML = this.orderHistory.map(order => `
                <tr>
                    <td>${order.time}</td>
                    <td>${order.asset}</td>
                    <td>
                        <span class="order-type ${order.type}">${order.type === 'buy' ? '买入' : '卖出'}</span>
                    </td>
                    <td>${order.quantity}</td>
                    <td>$${order.price.toFixed(2)}</td>
                    <td>$${order.fee}</td>
                    <td>
                        <span class="status ${order.status}">${this.getStatusLabel(order.status)}</span>
                    </td>
                </tr>
            `).join('');
        }
    }

    renderPositions() {
        const positionsGrid = document.getElementById('positionsGrid');
        if (!positionsGrid) return;

        positionsGrid.innerHTML = this.positions.map(position => `
            <div class="position-card">
                <div class="position-header">
                    <h4>${position.name}</h4>
                    <span class="position-symbol">${position.asset}</span>
                </div>
                <div class="position-details">
                    <div class="detail-row">
                        <span>持有数量:</span>
                        <span>${position.quantity} 份</span>
                    </div>
                    <div class="detail-row">
                        <span>平均成本:</span>
                        <span>$${position.avgPrice.toFixed(2)}</span>
                    </div>
                    <div class="detail-row">
                        <span>当前价格:</span>
                        <span>$${position.currentPrice.toFixed(2)}</span>
                    </div>
                    <div class="detail-row">
                        <span>未实现盈亏:</span>
                        <span class="${position.unrealizedPL >= 0 ? 'positive' : 'negative'}">
                            ${position.unrealizedPL >= 0 ? '+' : ''}$${position.unrealizedPL.toFixed(2)}
                            (${position.unrealizedPLPercent >= 0 ? '+' : ''}${position.unrealizedPLPercent.toFixed(2)}%)
                        </span>
                    </div>
                </div>
                <div class="position-actions">
                    <button class="btn btn-outline btn-sm" onclick="tradingManager.selectAssetBySymbol('${position.asset}')">
                        交易
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderOrderBook() {
        // 模拟买卖盘数据
        const buyOrders = [
            { price: 108.45, quantity: 150, total: 150 },
            { price: 108.40, quantity: 200, total: 350 },
            { price: 108.35, quantity: 100, total: 450 },
            { price: 108.30, quantity: 300, total: 750 },
            { price: 108.25, quantity: 180, total: 930 }
        ];

        const sellOrders = [
            { price: 108.55, quantity: 120, total: 120 },
            { price: 108.60, quantity: 250, total: 370 },
            { price: 108.65, quantity: 180, total: 550 },
            { price: 108.70, quantity: 200, total: 750 },
            { price: 108.75, quantity: 150, total: 900 }
        ];

        const buyOrdersDiv = document.getElementById('buyOrders');
        const sellOrdersDiv = document.getElementById('sellOrders');

        if (buyOrdersDiv) {
            buyOrdersDiv.innerHTML = buyOrders.map(order => `
                <div class="order-row">
                    <span>$${order.price.toFixed(2)}</span>
                    <span>${order.quantity}</span>
                    <span>${order.total}</span>
                </div>
            `).join('');
        }

        if (sellOrdersDiv) {
            sellOrdersDiv.innerHTML = sellOrders.map(order => `
                <div class="order-row">
                    <span>$${order.price.toFixed(2)}</span>
                    <span>${order.quantity}</span>
                    <span>${order.total}</span>
                </div>
            `).join('');
        }
    }

    switchManagementTab(tabName) {
        this.currentTab = tabName;
        
        // 更新标签状态
        document.querySelectorAll('.management-tabs .tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // 显示对应内容
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
    }

    selectAssetBySymbol(symbol) {
        const asset = this.assets.find(a => a.symbol === symbol);
        if (asset) {
            this.selectAsset(asset.id);
            // 滚动到交易表单
            document.querySelector('.trading-form').scrollIntoView({ behavior: 'smooth' });
        }
    }

    cancelOrder(orderId) {
        this.openOrders = this.openOrders.filter(order => order.id !== orderId);
        this.renderOrderTables();
        window.realEstateETF?.showNotification('订单已取消', 'success');
    }

    filterAssets(searchTerm) {
        const filteredAssets = this.assets.filter(asset => 
            asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.symbol.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const assetList = document.getElementById('tradingAssetList');
        if (assetList) {
            assetList.innerHTML = filteredAssets.map(asset => `
                <div class="asset-item" data-asset-id="${asset.id}">
                    <div class="asset-name">${asset.name}</div>
                    <div class="asset-price">
                        <span class="price-value">$${asset.price.toFixed(2)}</span>
                        <span class="price-change ${asset.change >= 0 ? 'positive' : 'negative'}">
                            ${asset.change >= 0 ? '+' : ''}${asset.change.toFixed(2)} (${asset.changePercent.toFixed(2)}%)
                        </span>
                    </div>
                </div>
            `).join('');

            // 重新绑定点击事件
            assetList.querySelectorAll('.asset-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const assetId = parseInt(e.currentTarget.dataset.assetId);
                    this.selectAsset(assetId);
                });
            });
        }
    }

    startPriceUpdates() {
        // 模拟实时价格更新
        setInterval(() => {
            this.assets.forEach(asset => {
                const changePercent = (Math.random() - 0.5) * 0.02; // ±1% 随机变化
                const oldPrice = asset.price;
                asset.price = Math.max(asset.price * (1 + changePercent), 0.01);
                asset.change = asset.price - oldPrice;
                asset.changePercent = (asset.change / oldPrice) * 100;
            });

            this.renderAssetList();
            this.renderPriceTicker();
            
            if (this.selectedAsset) {
                const updatedAsset = this.assets.find(a => a.id === this.selectedAsset.id);
                if (updatedAsset) {
                    this.selectedAsset = updatedAsset;
                    this.selectAsset(this.selectedAsset.id);
                }
            }
        }, 5000); // 每5秒更新一次
    }

    updateMarketTime() {
        const marketTimeElement = document.getElementById('marketTime');
        if (marketTimeElement) {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', { 
                hour12: false,
                timeZone: 'America/New_York'
            });
            marketTimeElement.textContent = `当前时间: ${timeString} EST`;
        }
    }

    getStatusLabel(status) {
        const labels = {
            'pending': '等待中',
            'partial': '部分成交',
            'completed': '已完成',
            'cancelled': '已取消',
            'failed': '失败'
        };
        return labels[status] || status;
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.tradingManager = new TradingManager();
    console.log('💹 交易中心页面已加载完成');
});

// 添加额外的样式
const tradingStyles = document.createElement('style');
tradingStyles.textContent = `
    .order-type.buy {
        color: var(--success-color);
        font-weight: 600;
    }

    .order-type.sell {
        color: var(--error-color);
        font-weight: 600;
    }

    .status.pending {
        color: var(--warning-color);
    }

    .status.partial {
        color: var(--primary-color);
    }

    .status.completed {
        color: var(--success-color);
    }

    .status.cancelled,
    .status.failed {
        color: var(--error-color);
    }

    .trade-confirmation {
        text-align: left;
    }

    .summary-details {
        margin: 1.5rem 0;
        background: var(--bg-secondary);
        padding: 1rem;
        border-radius: var(--border-radius);
    }

    .detail-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
    }

    .detail-row.total {
        border-top: 1px solid var(--border-color);
        padding-top: 0.5rem;
        font-weight: 600;
        color: var(--primary-color);
    }

    .confirmation-actions {
        display: flex;
        gap: 1rem;
        margin-top: 1.5rem;
    }

    .confirmation-actions .btn {
        flex: 1;
    }

    .position-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--border-color);
    }

    .position-symbol {
        background: var(--primary-color);
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
    }

    .position-details {
        margin-bottom: 1.5rem;
    }

    .position-details .detail-row {
        margin-bottom: 0.75rem;
    }

    .position-actions {
        display: flex;
        gap: 0.5rem;
    }

    .btn-sm {
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
    }

    .btn-trade.buy {
        background: var(--success-color);
    }

    .btn-trade.sell {
        background: var(--error-color);
    }

    .ticker-volume {
        font-size: 0.75rem;
        color: var(--text-light);
    }

    .asset-details {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.875rem;
        margin-top: 0.5rem;
    }
`;

document.head.appendChild(tradingStyles); 