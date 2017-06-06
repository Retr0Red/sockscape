﻿using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Square.INI {
    public class Section : IEnumerable {
        private List<Instance> Instances;

        public IEnumerator GetEnumerator() {
            return Instances.GetEnumerator();
        }
    }
}