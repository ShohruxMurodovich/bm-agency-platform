#!/bin/bash
# Server Optimization Script for 4GB RAM VPS
# Run this ONCE after initial server setup

set -e

echo "🔧 Optimizing server for 4GB RAM..."

# 1. Enable swap (4GB) - CRITICAL for 4GB RAM
echo "📝 Creating swap file..."
if [ ! -f /swapfile ]; then
    fallocate -l 4G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
    echo "vm.swappiness=10" | tee -a /etc/sysctl.conf
    sysctl -p
    echo "✅ Swap enabled (4GB)"
else
    echo "✅ Swap already exists"
fi

# 2. Optimize system limits
echo "📝 Optimizing system limits..."
cat >> /etc/security/limits.conf << EOF
* soft nofile 65536
* hard nofile 65536
* soft nproc 32768
* hard nproc 32768
EOF

# 3. Optimize sysctl for performance
echo "📝 Optimizing kernel parameters..."
cat >> /etc/sysctl.conf << EOF

# Network optimization
net.core.somaxconn = 1024
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.ip_local_port_range = 1024 65535

# Memory optimization
vm.overcommit_memory = 1
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5

# Connection tracking
net.netfilter.nf_conntrack_max = 131072
EOF

sysctl -p

# 4. Install monitoring tools
echo "📝 Installing monitoring tools..."
apt update
apt install -y htop iotop nethogs

# 5. Set up log rotation for Docker
echo "📝 Configuring Docker log rotation..."
cat > /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

systemctl restart docker

# 6. Create monitoring script
echo "📝 Creating monitoring script..."
cat > /usr/local/bin/monitor-resources.sh << 'EOF'
#!/bin/bash
echo "=== System Resources ==="
echo "Memory:"
free -h
echo ""
echo "CPU:"
mpstat 1 1 || uptime
echo ""
echo "Disk:"
df -h /
echo ""
echo "=== Docker Stats ==="
docker stats --no-stream
echo ""
echo "=== Top Processes ==="
ps aux --sort=-%mem | head -10
EOF

chmod +x /usr/local/bin/monitor-resources.sh

# 7. Create cleanup script
cat > /usr/local/bin/cleanup-docker.sh << 'EOF'
#!/bin/bash
echo "🧹 Cleaning Docker resources..."
docker system prune -af --volumes
echo "✅ Cleanup complete"
EOF

chmod +x /usr/local/bin/cleanup-docker.sh

# 8. Setup daily cleanup cron
echo "📝 Setting up automatic cleanup..."
(crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/cleanup-docker.sh >> /var/log/docker-cleanup.log 2>&1") | crontab -

echo ""
echo "✅ Server optimization complete!"
echo ""
echo "📊 Run 'monitor-resources.sh' to check resources"
echo "🧹 Run 'cleanup-docker.sh' to free up space"
echo ""
echo "⚠️  IMPORTANT: Reboot server for all changes to take effect"
echo "   Run: sudo reboot"
