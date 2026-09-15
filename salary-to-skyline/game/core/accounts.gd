class_name Accounts
extends RefCounted

## Account chart for the double-entry journal (ECONOMY_SPEC E2).
##
## Entries are stored DEBIT-POSITIVE: every balanced transaction sums to zero.
## Assets and expenses increase with a positive amount; liabilities, equity and
## revenue increase with a negative amount. `display_balance()` flips credit
## accounts back to their natural positive reading for the UI.
##
## M0 posts to a subset of these. The rest are declared now so that later
## milestones extend the chart instead of redefining the ledger.

const KIND_ASSET: String = "asset"
const KIND_LIABILITY: String = "liability"
const KIND_EQUITY: String = "equity"
const KIND_REVENUE: String = "revenue"
const KIND_EXPENSE: String = "expense"

# Assets
const CASH_OPERATING: String = "asset_cash_operating"
const CASH_RESTRICTED_DEPOSITS: String = "asset_cash_restricted_deposits"
const CASH_RESERVE_EARMARKED: String = "asset_cash_reserve_earmarked"
const RECEIVABLES: String = "asset_receivables"
const PROPERTY_READY_AT_COST: String = "asset_property_ready_at_cost"
const OFFPLAN_PREPAYMENTS: String = "asset_offplan_prepayments"
const FINANCIAL_HOLDINGS: String = "asset_financial_holdings"
const VEHICLES_AND_EQUIPMENT: String = "asset_vehicles_equipment"

# Liabilities
const DEBT_MORTGAGE: String = "liability_debt_mortgage"
const DEBT_EDUCATION: String = "liability_debt_education"
const DEBT_BUSINESS: String = "liability_debt_business"
const TENANT_DEPOSITS: String = "liability_tenant_deposits"
const ADVANCE_RENT: String = "liability_advance_rent"
const BILLS_DUE_ARREARS: String = "liability_bills_due_arrears"

# Equity
const OWNER_CAPITAL: String = "equity_owner_capital"
const VALUATION_ADJUSTMENT: String = "equity_valuation_adjustment"

# Revenue
const REVENUE_SALARY: String = "revenue_salary"
const REVENUE_STIPEND: String = "revenue_stipend"
const REVENUE_RENT: String = "revenue_rent"
const REVENUE_BUSINESS: String = "revenue_business"

# Expense
const EXPENSE_ESSENTIALS: String = "expense_essentials"
const EXPENSE_DISCRETIONARY: String = "expense_discretionary"
const EXPENSE_TUITION: String = "expense_tuition"
const EXPENSE_PROPERTY_OPERATING: String = "expense_property_operating"
const EXPENSE_INTEREST: String = "expense_interest"
const EXPENSE_FEES: String = "expense_fees"
const EXPENSE_ARREARS_CHARGE: String = "expense_arrears_charge"

const CHART: Dictionary = {
	CASH_OPERATING: KIND_ASSET,
	CASH_RESTRICTED_DEPOSITS: KIND_ASSET,
	CASH_RESERVE_EARMARKED: KIND_ASSET,
	RECEIVABLES: KIND_ASSET,
	PROPERTY_READY_AT_COST: KIND_ASSET,
	OFFPLAN_PREPAYMENTS: KIND_ASSET,
	FINANCIAL_HOLDINGS: KIND_ASSET,
	VEHICLES_AND_EQUIPMENT: KIND_ASSET,
	DEBT_MORTGAGE: KIND_LIABILITY,
	DEBT_EDUCATION: KIND_LIABILITY,
	DEBT_BUSINESS: KIND_LIABILITY,
	TENANT_DEPOSITS: KIND_LIABILITY,
	ADVANCE_RENT: KIND_LIABILITY,
	BILLS_DUE_ARREARS: KIND_LIABILITY,
	OWNER_CAPITAL: KIND_EQUITY,
	VALUATION_ADJUSTMENT: KIND_EQUITY,
	REVENUE_SALARY: KIND_REVENUE,
	REVENUE_STIPEND: KIND_REVENUE,
	REVENUE_RENT: KIND_REVENUE,
	REVENUE_BUSINESS: KIND_REVENUE,
	EXPENSE_ESSENTIALS: KIND_EXPENSE,
	EXPENSE_DISCRETIONARY: KIND_EXPENSE,
	EXPENSE_TUITION: KIND_EXPENSE,
	EXPENSE_PROPERTY_OPERATING: KIND_EXPENSE,
	EXPENSE_INTEREST: KIND_EXPENSE,
	EXPENSE_FEES: KIND_EXPENSE,
	EXPENSE_ARREARS_CHARGE: KIND_EXPENSE,
}

## Cash-like asset accounts. Restricted and earmarked cash is owned but is not
## spendable; see GameState.spendable_cash().
const CASH_ACCOUNTS: Array = [CASH_OPERATING, CASH_RESTRICTED_DEPOSITS, CASH_RESERVE_EARMARKED]


static func exists(account: String) -> bool:
	return CHART.has(account)


static func kind_of(account: String) -> String:
	return String(CHART.get(account, ""))


static func is_credit_normal(account: String) -> bool:
	var kind: String = kind_of(account)
	return kind == KIND_LIABILITY or kind == KIND_EQUITY or kind == KIND_REVENUE


## Converts the internal debit-positive balance into the number a player expects
## to read (debt of 480,000 shows as 480,000, not -480,000).
static func display_balance(account: String, signed_balance: int) -> int:
	return -signed_balance if is_credit_normal(account) else signed_balance
