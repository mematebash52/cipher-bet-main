#!/bin/bash

# FHEVM 配置快速验证脚本
# 用途：一键验证合约的 FHEVM 配置是否正确

echo "╔══════════════════════════════════════════════════════════╗"
echo "║       FHEVM 配置验证工具                                 ║"
echo "║       ConfidentialMarketV2 Contract                      ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_command() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
        return 0
    else
        echo -e "${RED}❌ $1${NC}"
        return 1
    fi
}

# 1. 检查依赖
echo "📦 检查依赖..."
npm list @fhevm/hardhat-plugin > /dev/null 2>&1
check_command "FHEVM Hardhat Plugin 已安装"

# 2. 编译合约
echo ""
echo "🔨 编译合约..."
npm run hh:compile > /dev/null 2>&1
check_command "合约编译成功"

# 3. 运行基础测试
echo ""
echo "🧪 运行基础功能测试..."
npx hardhat test test/ConfidentialMarketV2.test.cjs --grep "Should allow owner to create a market" 2>&1 | grep -q "1 passing"
check_command "基础功能测试通过"

# 4. 运行 FHE 加密测试
echo ""
echo "🔐 运行 FHE 加密功能测试..."
npx hardhat test test/ConfidentialMarketV2.test.cjs --grep "Should allow users to place encrypted bets" 2>&1 | grep -q "2 passing"
check_command "FHE 加密功能测试通过"

# 5. 运行多用户测试
echo ""
echo "👥 运行多用户投票测试..."
npx hardhat test test/ConfidentialMarketV2.test.cjs --grep "Should allow multiple users to vote" 2>&1 | grep -q "1 passing"
check_command "多用户投票测试通过"

# 6. 运行访问控制测试
echo ""
echo "🛡️  运行访问控制测试..."
npx hardhat test test/ConfidentialMarketV2.test.cjs --grep "Should not allow double voting" 2>&1 | grep -q "1 passing"
check_command "访问控制测试通过"

# 7. 运行完整测试套件
echo ""
echo "🎯 运行完整测试套件（这可能需要几秒钟）..."
TEST_OUTPUT=$(npm run hh:test 2>&1)
PASSING_COUNT=$(echo "$TEST_OUTPUT" | grep -o "[0-9]* passing" | grep -o "[0-9]*")

if [ "$PASSING_COUNT" = "25" ]; then
    echo -e "${GREEN}✅ 所有 25 个测试通过${NC}"
    TESTS_PASSED=true
else
    echo -e "${RED}❌ 部分测试失败 ($PASSING_COUNT/25 通过)${NC}"
    TESTS_PASSED=false
fi

# 最终总结
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                   验证结果总结                           ║"
echo "╠══════════════════════════════════════════════════════════╣"

if [ "$TESTS_PASSED" = true ]; then
    echo -e "║  ${GREEN}状态: ✅ 所有验证通过${NC}                             ║"
    echo "║                                                          ║"
    echo "║  🎉 您的合约已正确配置 FHEVM！                         ║"
    echo "║                                                          ║"
    echo "║  下一步:                                                ║"
    echo "║  1. 部署到 Zama Devnet:                                 ║"
    echo "║     npm run hh:deploy:zama                              ║"
    echo "║                                                          ║"
    echo "║  2. 查看完整文档:                                       ║"
    echo "║     cat FHEVM_VERIFICATION.md                           ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    exit 0
else
    echo -e "║  ${RED}状态: ❌ 验证失败${NC}                                 ║"
    echo "║                                                          ║"
    echo "║  请检查:                                                ║"
    echo "║  1. 合约代码是否正确继承 SepoliaConfig                 ║"
    echo "║  2. FHE 操作是否正确调用 allowThis()                   ║"
    echo "║  3. 测试配置是否正确                                   ║"
    echo "║                                                          ║"
    echo "║  查看详细错误信息:                                     ║"
    echo "║     npm run hh:test                                     ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    exit 1
fi
