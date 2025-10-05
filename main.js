     // متغيرات التطبيق
        let debts = JSON.parse(localStorage.getItem('advertisements')) || [];
        let currentDebtId = null;
        let filteredDebts = [...debts];
        let currentFilter = 'all';

        // عناصر DOM
        const debtsContainer = document.getElementById('debts-container');
        const totalAmountElement = document.getElementById('total-amount');
        const debtorsCountElement = document.getElementById('debtors-count');
        const activeDebtsElement = document.getElementById('active-debts');
        const addDebtBtn = document.getElementById('add-debt-btn');
        const searchInput = document.getElementById('search-input');
        const clearSearchBtn = document.getElementById('clear-search');
        const filterButtons = document.querySelectorAll('.filter-btn');
        const notification = document.getElementById('notification');

        // النوافذ المنبثقة
        const deductModal = document.getElementById('deduct-modal');
        const editModal = document.getElementById('edit-modal');
        const addModal = document.getElementById('add-modal');
        const historyModal = document.getElementById('history-modal');

        // تهيئة التطبيق
        document.addEventListener('DOMContentLoaded', () => {
            updateStats();
            renderDebts();
            setupEventListeners();
        });

        // إعداد مستمعي الأحداث
        function setupEventListeners() {
            // إضافة دين جديد
            addDebtBtn.addEventListener('click', addNewDebt);
            
            // البحث
            searchInput.addEventListener('input', filterDebts);
            clearSearchBtn.addEventListener('click', clearSearch);
            
            // التصفية
            filterButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    filterButtons.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    currentFilter = this.dataset.filter;
                    filterDebts();
                });
            });
            
            // النوافذ المنبثقة
            document.getElementById('deduct-cancel').addEventListener('click', () => deductModal.style.display = 'none');
            document.getElementById('edit-cancel').addEventListener('click', () => editModal.style.display = 'none');
            document.getElementById('add-cancel').addEventListener('click', () => addModal.style.display = 'none');
            document.getElementById('history-close').addEventListener('click', () => historyModal.style.display = 'none');
            
            // تأكيد الإجراءات
            document.getElementById('deduct-confirm').addEventListener('click', deductAmount);
            document.getElementById('edit-confirm').addEventListener('click', editDebtAmount);
            document.getElementById('add-confirm').addEventListener('click', addToDebtAmount);
        }

        // إضافة دين جديد
        function addNewDebt() {
            const nameInput = document.getElementById('new-name');
            const amountInput = document.getElementById('new-amount');
            const phoneInput = document.getElementById('new-phone');
            
            const name = nameInput.value.trim();
            const amount = parseInt(amountInput.value);
            const phone = phoneInput.value.trim();
            
            if (!name || !amount || amount <= 0) {
                showNotification('يرجى إدخال اسم المدين ومبلغ صحيح', 'error');
                return;
            }
            
            const newDebt = {
                id: Date.now(),
                name,
                amount,
                phone: phone || 'غير مسجل',
                history: [{
                    id: generateId(),
                    type: 'new',
                    amount: amount,
                    description: 'إنشاء دين جديد',
                    date: new Date().toLocaleString('ar-EG'),
                    timestamp: new Date().getTime()
                }]
            };
            
            debts.push(newDebt);
            filteredDebts = [...debts];
            saveDebts();
            updateStats();
            renderDebts();
            
            // إعادة تعيين الحقول
            nameInput.value = '';
            amountInput.value = '';
            phoneInput.value = '';
            
            showNotification('تم إضافة المدين الجديد بنجاح');
        }

        // توليد معرف فريد
        function generateId() {
            return Date.now() + Math.floor(Math.random() * 1000);
        }

        // عرض الديون
        function renderDebts() {
            if (filteredDebts.length === 0) {
                debtsContainer.innerHTML = `
                    <div class="no-debts">
                        <i class="fas fa-file-invoice-dollar"></i>
                        <p>${debts.length === 0 ? 'لا توجد ديون مسجلة في النظام' : 'لا توجد نتائج مطابقة للبحث'}</p>
                    </div>
                `;
                return;
            }
            
            debtsContainer.innerHTML = filteredDebts.map(debt => `
                <div class="debt-card">
                    <h3>${debt.name}</h3>
                    <p><i class="fas fa-phone"></i> ${debt.phone}</p>
                    <div class="amount">${debt.amount} ج.م</div>
                    <div class="debt-actions">
                        <button class="action-btn btn-deduct" onclick="openDeductModal(${debt.id})">
                            <i class="fas fa-minus"></i> تسديد
                        </button>
                        <button class="action-btn btn-edit" onclick="openEditModal(${debt.id})">
                            <i class="fas fa-edit"></i> تعديل
                        </button>
                        <button class="action-btn btn-add" onclick="openAddModal(${debt.id})">
                            <i class="fas fa-plus"></i> إضافة
                        </button>
                        <button class="action-btn btn-history" onclick="showHistory(${debt.id})">
                            <i class="fas fa-history"></i> السجل
                        </button>
                        <button class="action-btn btn-delete" onclick="deleteDebt(${debt.id})">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                    </div>
                </div>
            `).join('');
        }

        // تصفية الديون حسب البحث والتصفية
        function filterDebts() {
            const searchTerm = searchInput.value.trim().toLowerCase();
            
            // التصفية حسب البحث
            let result = debts;
            if (searchTerm !== '') {
                result = result.filter(debt => 
                    debt.name.toLowerCase().includes(searchTerm)
                );
            }
            
            // التصفية حسب النوع
            if (currentFilter === 'active') {
                result = result.filter(debt => debt.amount > 0);
            } else if (currentFilter === 'paid') {
                result = result.filter(debt => debt.amount === 0);
            } else if (currentFilter === 'large') {
                result = result.filter(debt => debt.amount > 1000);
            }
            
            filteredDebts = result;
            renderDebts();
        }

        // مسح البحث
        function clearSearch() {
            searchInput.value = '';
            filterDebts();
        }

        // فتح نوافذ التعديل
        function openDeductModal(id) {
            currentDebtId = id;
            document.getElementById('deduct-amount').value = '';
            document.getElementById('deduct-description').value = '';
            deductModal.style.display = 'flex';
        }

        function openEditModal(id) {
            currentDebtId = id;
            const debt = debts.find(d => d.id === id);
            document.getElementById('edit-amount').value = debt.amount;
            editModal.style.display = 'flex';
        }

        function openAddModal(id) {
            currentDebtId = id;
            document.getElementById('add-amount').value = '';
            document.getElementById('add-description').value = '';
            addModal.style.display = 'flex';
        }

        // إجراءات التعديل
        function deductAmount() {
            const amount = parseInt(document.getElementById('deduct-amount').value);
            const description = document.getElementById('deduct-description').value.trim();
            
            if (!amount || amount <= 0) {
                showNotification('يرجى إدخال مبلغ صحيح', 'error');
                return;
            }
            
            const debtIndex = debts.findIndex(d => d.id === currentDebtId);
            if (debts[debtIndex].amount < amount) {
                showNotification('المبلغ المطلوب تسديده أكبر من قيمة الدين', 'error');
                return;
            }
            
            debts[debtIndex].amount -= amount;
            debts[debtIndex].history.push({
                id: generateId(),
                type: 'deduct',
                amount: amount,
                description: description || 'تسديد جزء من الدين',
                date: new Date().toLocaleString('ar-EG'),
                timestamp: new Date().getTime()
            });
            
            saveDebts();
            updateStats();
            renderDebts();
            deductModal.style.display = 'none';
            
            showNotification('تم تسديد المبلغ بنجاح');
        }

        function editDebtAmount() {
            const amount = parseInt(document.getElementById('edit-amount').value);
            if (!amount || amount <= 0) {
                showNotification('يرجى إدخال مبلغ صحيح', 'error');
                return;
            }
            
            const debtIndex = debts.findIndex(d => d.id === currentDebtId);
            const oldAmount = debts[debtIndex].amount;
            debts[debtIndex].amount = amount;
            
            debts[debtIndex].history.push({
                id: generateId(),
                type: 'edit',
                oldAmount: oldAmount,
                newAmount: amount,
                description: 'تعديل قيمة الدين',
                date: new Date().toLocaleString('ar-EG'),
                timestamp: new Date().getTime()
            });
            
            saveDebts();
            updateStats();
            renderDebts();
            editModal.style.display = 'none';
            
            showNotification('تم تعديل قيمة الدين بنجاح');
        }

        function addToDebtAmount() {
            const amount = parseInt(document.getElementById('add-amount').value);
            const description = document.getElementById('add-description').value.trim();
            
            if (!amount || amount <= 0) {
                showNotification('يرجى إدخال مبلغ صحيح', 'error');
                return;
            }
            
            const debtIndex = debts.findIndex(d => d.id === currentDebtId);
            debts[debtIndex].amount += amount;
            
            debts[debtIndex].history.push({
                id: generateId(),
                type: 'add',
                amount: amount,
                description: description || 'إضافة إلى الدين',
                date: new Date().toLocaleString('ar-EG'),
                timestamp: new Date().getTime()
            });
            
            saveDebts();
            updateStats();
            renderDebts();
            addModal.style.display = 'none';
            
            showNotification('تم إضافة المبلغ إلى الدين بنجاح');
        }

        // عرض السجل
        function showHistory(id) {
            const debt = debts.find(d => d.id === id);
            const historyList = document.getElementById('history-list');
            
            historyList.innerHTML = debt.history.map(record => {
                let recordHtml = '';
                
                if (record.type === 'new') {
                    recordHtml = `
                        <div class="history-item">
                            <div class="history-details">
                                <div class="history-type">إنشاء دين جديد</div>
                                ${record.description ? `<div class="history-description">${record.description}</div>` : ''}
                                <div class="history-date">${record.date}</div>
                            </div>
                            <div class="history-actions">
                                <span class="history-amount">${record.amount} ج.م</span>
                                <button class="delete-history" onclick="deleteHistoryItem(${debt.id}, ${record.id})">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    `;
                } else if (record.type === 'deduct') {
                    recordHtml = `
                        <div class="history-item">
                            <div class="history-details">
                                <div class="history-type">تسديد من الدين</div>
                                ${record.description ? `<div class="history-description">${record.description}</div>` : ''}
                                <div class="history-date">${record.date}</div>
                            </div>
                            <div class="history-actions">
                                <span class="history-amount deducted">-${record.amount} ج.م</span>
                                <button class="delete-history" onclick="deleteHistoryItem(${debt.id}, ${record.id})">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    `;
                } else if (record.type === 'add') {
                    recordHtml = `
                        <div class="history-item">
                            <div class="history-details">
                                <div class="history-type">إضافة إلى الدين</div>
                                ${record.description ? `<div class="history-description">${record.description}</div>` : ''}
                                <div class="history-date">${record.date}</div>
                            </div>
                            <div class="history-actions">
                                <span class="history-amount added">+${record.amount} ج.م</span>
                                <button class="delete-history" onclick="deleteHistoryItem(${debt.id}, ${record.id})">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    `;
                } else if (record.type === 'edit') {
                    recordHtml = `
                        <div class="history-item">
                            <div class="history-details">
                                <div class="history-type">تعديل قيمة الدين</div>
                                ${record.description ? `<div class="history-description">${record.description}</div>` : ''}
                                <div class="history-date">${record.date}</div>
                            </div>
                            <div class="history-actions">
                                <span class="history-amount edited">${record.oldAmount} → ${record.newAmount} ج.م</span>
                                <button class="delete-history" onclick="deleteHistoryItem(${debt.id}, ${record.id})">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    `;
                }
                
                return recordHtml;
            }).join('');
            
            historyModal.style.display = 'flex';
        }

        // حذف عنصر من السجل
        function deleteHistoryItem(debtId, historyId) {
            if (!confirm('هل أنت متأكد من حذف هذه العملية من السجل؟')) return;
            
            const debtIndex = debts.findIndex(d => d.id === debtId);
            if (debtIndex === -1) return;
            
            // البحث عن العملية في السجل
            const historyIndex = debts[debtIndex].history.findIndex(h => h.id === historyId);
            if (historyIndex === -1) return;
            
            const historyItem = debts[debtIndex].history[historyIndex];
            
            // لا يمكن حذف عملية إنشاء الدين الأساسية
            if (historyItem.type === 'new' && debts[debtIndex].history.length > 1) {
                showNotification('لا يمكن حذف عملية إنشاء الدين الأساسية طالما توجد عمليات أخرى مرتبطة بها', 'error');
                return;
            }
            
            // حذف العملية من السجل
            debts[debtIndex].history.splice(historyIndex, 1);
            
            // إذا كان هذا هو العنصر الأخير في السجل، احذف الدين بالكامل
            if (debts[debtIndex].history.length === 0) {
                debts.splice(debtIndex, 1);
            }
            
            saveDebts();
            updateStats();
            renderDebts();
            
            // إعادة فتح نافذة السجل إذا كانت مفتوحة
            if (historyModal.style.display === 'flex') {
                showHistory(debtId);
            }
            
            showNotification('تم حذف العملية من السجل');
        }

        // حذف الدين
        function deleteDebt(id) {
            if (confirm('هل أنت متأكد من حذف هذا الدين؟')) {
                debts = debts.filter(d => d.id !== id);
                filteredDebts = [...debts];
                saveDebts();
                updateStats();
                renderDebts();
                showNotification('تم حذف الدين بنجاح');
            }
        }

        // تحديث الإحصائيات
        function updateStats() {
            const totalAmount = debts.reduce((sum, debt) => sum + debt.amount, 0);
            const debtorsCount = debts.length;
            const activeDebts = debts.filter(d => d.amount > 0).length;
            
            totalAmountElement.textContent = `${totalAmount} ج.م`;
            debtorsCountElement.textContent = debtorsCount;
            activeDebtsElement.textContent = activeDebts;
        }

        // حفظ البيانات في localStorage
        function saveDebts() {
            localStorage.setItem('advertisements', JSON.stringify(debts));
        }

        // عرض الإشعارات
        function showNotification(message, type = 'success') {
            notification.textContent = message;
            notification.className = 'notification';
            notification.classList.add(type === 'error' ? 'error' : 'success');
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }