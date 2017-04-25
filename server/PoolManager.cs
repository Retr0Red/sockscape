﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using CircleScape.Websocket;
using System.Net.Sockets;

namespace CircleScape {
    static class PoolManager {
        private static Pool<PendingConnection> PendingConnectionsPool;
        private static Pool<ActiveConnection> ActiveConnectionsPool;

        static PoolManager() {
            PendingConnectionsPool = new Pool<PendingConnection> {
                InitialCount = 1,
                InitialSize = 10,
                SizeGrowth = 10,
                MaxSize = 50,
                MaxCount = 5
            };

            ActiveConnectionsPool = new Pool<ActiveConnection>();

            var test = new PendingConnection(new TcpClient());
            var teste = test as ActiveConnection;

            
        }
    }
}