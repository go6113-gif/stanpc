import csv, requests
res = requests.get('https://biasroom.com/api/members?limit=all', headers={'User-Agent': 'Mozilla/5.0'}).json()
members = res.get('members', res) if isinstance(res, dict) else res
headers = ['SKU_ID', 'Group_Name', 'Member_Name', 'Album_Version', 'Card_Title', 'Image_URL', 'US_Market_Price', 'JP_Market_Price', 'eBay_Aff_Link', 'Yahoo_Aff_Link', 'Condition_Grade', 'Last_Updated']
rows = []
for i, m in enumerate(members):
    g_name = m.get('group', {}).get('name', 'K-POP') if isinstance(m.get('group'), dict) else m.get('groupName', 'K-POP')
    m_name = m.get('name') or m.get('memberName', 'Unknown')
    prefix = g_name[:3].upper() if len(g_name) >= 3 else 'POC'
    rows.append([f'PE-{prefix}-{10000+i}', g_name, m_name, 'Standard', f'{g_name} {m_name} Official Photocard', '', '0.00', '0', f'https://www.ebay.com/sch/i.html?_nkw={g_name}+{m_name}+photocard', f'https://auctions.yahoo.co.jp/search/search?p={g_name}+{m_name}+photocard', 'Ungraded', '2026-08-09'])
with open('poca_master_db.csv', 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f)
    w.writerow(headers)
    w.writerows(rows)
print('SUCCESS:', len(rows), 'rows saved to poca_master_db.csv')
